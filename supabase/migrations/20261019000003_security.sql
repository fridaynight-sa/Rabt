-- Rabt: table privileges and row level security.
--
-- Two layers, both required:
--   1. GRANTs say which tables (and which columns) a role may touch at all.
--   2. RLS policies say which rows.
-- Admin changes (suspend, hide, verify) go through audited functions in a later
-- migration, not through direct table writes.

-- Start from nothing.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;

-- Supabase opens new tables and functions to everyone by default.
-- Turn that off so anything added later is closed until a migration grants it.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke execute on functions from anon, authenticated;
-- Postgres also lets PUBLIC run new functions; each migration revokes that itself,
-- and supabase/tests checks no function is left open by mistake.

alter table public.cities enable row level security;
alter table public.sectors enable row level security;
alter table public.categories enable row level security;
alter table public.profiles enable row level security;
alter table public.providers enable row level security;
alter table public.provider_sectors enable row level security;
alter table public.provider_categories enable row level security;
alter table public.portfolio_images enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.reviews enable row level security;
alter table public.reports enable row level security;
alter table public.page_views_daily enable row level security;
alter table public.audit_log enable row level security;

-- ---------------------------------------------------------------------------
-- Reference data: readable by everyone, written only by migrations/admin tools.
-- ---------------------------------------------------------------------------

grant select on public.cities, public.sectors, public.categories to anon, authenticated;

create policy "reference data is public" on public.cities for select using (true);
create policy "reference data is public" on public.sectors for select using (true);
create policy "reference data is public" on public.categories for select using (true);

-- ---------------------------------------------------------------------------
-- Profiles: private. You see and edit your own; admins see all.
-- Role and status can never be changed by the user (no column grant).
-- ---------------------------------------------------------------------------

grant select on public.profiles to authenticated;
grant update (full_name, phone) on public.profiles to authenticated;

create policy "read own profile" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "update own profile" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()) and status = 'active')
  with check (id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Providers: public page for active accounts; the owner edits their own.
-- Slug, verification and rating fields are not editable by the owner.
-- ---------------------------------------------------------------------------

grant select on public.providers to anon, authenticated;
grant update (business_name, city_id, whatsapp, services, description)
  on public.providers to authenticated;

create policy "public providers" on public.providers
  for select
  using (
    (select public.is_account_active(id))
    or id = (select auth.uid())
    or (select public.is_admin())
  );

create policy "update own provider page" on public.providers
  for update to authenticated
  using (id = (select auth.uid()) and (select public.current_user_role()) = 'provider')
  with check (id = (select auth.uid()));

-- Sectors and categories a provider serves.
grant select on public.provider_sectors, public.provider_categories to anon, authenticated;
grant insert, delete on public.provider_sectors, public.provider_categories to authenticated;

create policy "public provider sectors" on public.provider_sectors
  for select using (true);
create policy "owner adds sectors" on public.provider_sectors
  for insert to authenticated
  with check (provider_id = (select auth.uid()) and (select public.current_user_role()) = 'provider');
create policy "owner removes sectors" on public.provider_sectors
  for delete to authenticated
  using (provider_id = (select auth.uid()));

create policy "public provider categories" on public.provider_categories
  for select using (true);
create policy "owner adds categories" on public.provider_categories
  for insert to authenticated
  with check (provider_id = (select auth.uid()) and (select public.current_user_role()) = 'provider');
create policy "owner removes categories" on public.provider_categories
  for delete to authenticated
  using (provider_id = (select auth.uid()));

-- Portfolio images.
grant select on public.portfolio_images to anon, authenticated;
grant insert (provider_id, storage_key, sort_order), delete on public.portfolio_images to authenticated;
grant update (sort_order) on public.portfolio_images to authenticated;

create policy "public portfolio" on public.portfolio_images
  for select
  using ((select public.is_account_active(provider_id)) or provider_id = (select auth.uid()));
create policy "owner adds portfolio images" on public.portfolio_images
  for insert to authenticated
  with check (provider_id = (select auth.uid()) and (select public.current_user_role()) = 'provider');
create policy "owner reorders portfolio images" on public.portfolio_images
  for update to authenticated
  using (provider_id = (select auth.uid()))
  with check (provider_id = (select auth.uid()));
create policy "owner removes portfolio images" on public.portfolio_images
  for delete to authenticated
  using (provider_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- Listings: public when published and the provider is active.
-- The owner sees all of theirs (including hidden) but cannot unhide.
-- ---------------------------------------------------------------------------

grant select on public.listings to anon, authenticated;
grant insert (provider_id, title, description, price, city_id, category_id, contact_method)
  on public.listings to authenticated;
grant update (title, description, price, city_id, category_id, contact_method)
  on public.listings to authenticated;
grant delete on public.listings to authenticated;

create policy "public listings" on public.listings
  for select
  using (
    (status = 'published' and (select public.is_account_active(provider_id)))
    or provider_id = (select auth.uid())
    or (select public.is_admin())
  );
create policy "provider creates listings" on public.listings
  for insert to authenticated
  with check (provider_id = (select auth.uid()) and (select public.current_user_role()) = 'provider');
create policy "provider edits own listings" on public.listings
  for update to authenticated
  using (provider_id = (select auth.uid()) and (select public.current_user_role()) = 'provider')
  with check (provider_id = (select auth.uid()));
create policy "provider deletes own listings" on public.listings
  for delete to authenticated
  using (provider_id = (select auth.uid()));

-- Listing images follow their listing.
grant select on public.listing_images to anon, authenticated;
grant insert (listing_id, storage_key, sort_order), delete on public.listing_images to authenticated;
grant update (sort_order) on public.listing_images to authenticated;

create policy "listing images follow listing" on public.listing_images
  for select
  using (exists (select 1 from public.listings l where l.id = listing_id));
create policy "owner adds listing images" on public.listing_images
  for insert to authenticated
  with check (
    (select public.current_user_role()) = 'provider'
    and exists (
      select 1 from public.listings l
      where l.id = listing_id and l.provider_id = (select auth.uid())
    )
  );
create policy "owner reorders listing images" on public.listing_images
  for update to authenticated
  using (exists (
    select 1 from public.listings l
    where l.id = listing_id and l.provider_id = (select auth.uid())
  ));
create policy "owner removes listing images" on public.listing_images
  for delete to authenticated
  using (exists (
    select 1 from public.listings l
    where l.id = listing_id and l.provider_id = (select auth.uid())
  ));

-- ---------------------------------------------------------------------------
-- Reviews: public. Only active merchants write, one per provider, own only.
-- ---------------------------------------------------------------------------

grant select on public.reviews to anon, authenticated;
grant insert (provider_id, merchant_id, rating, comment) on public.reviews to authenticated;
grant update (rating, comment) on public.reviews to authenticated;
grant delete on public.reviews to authenticated;

create policy "public reviews" on public.reviews
  for select
  using ((select public.is_account_active(provider_id)) or (select public.is_admin()));
create policy "merchant writes own review" on public.reviews
  for insert to authenticated
  with check (merchant_id = (select auth.uid()) and (select public.current_user_role()) = 'merchant');
create policy "merchant edits own review" on public.reviews
  for update to authenticated
  using (merchant_id = (select auth.uid()) and (select public.current_user_role()) = 'merchant')
  with check (merchant_id = (select auth.uid()));
create policy "merchant or admin deletes review" on public.reviews
  for delete to authenticated
  using (merchant_id = (select auth.uid()) or (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Reports: any active user can report; only the reporter and admins read.
-- ---------------------------------------------------------------------------

grant select on public.reports to authenticated;
grant insert (reporter_id, target_type, target_id, reason) on public.reports to authenticated;

create policy "read own reports" on public.reports
  for select to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_admin()));
create policy "active users report" on public.reports
  for insert to authenticated
  with check (reporter_id = (select auth.uid()) and (select public.current_user_role()) is not null);

-- ---------------------------------------------------------------------------
-- Admin-only data.
-- ---------------------------------------------------------------------------

grant select on public.page_views_daily, public.audit_log to authenticated;

create policy "admins read page views" on public.page_views_daily
  for select to authenticated
  using ((select public.is_admin()));
create policy "admins read audit log" on public.audit_log
  for select to authenticated
  using ((select public.is_admin()));
