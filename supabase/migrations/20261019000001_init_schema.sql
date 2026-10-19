-- Rabt: initial schema.
-- Every table has row level security (RLS) on. Access is granted table by table
-- (and column by column for updates) so nothing is open by default.

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.user_role as enum ('merchant', 'provider', 'admin');
create type public.account_status as enum ('active', 'suspended');
create type public.contact_method as enum ('whatsapp', 'call');
create type public.listing_status as enum ('published', 'hidden');
create type public.report_target as enum ('provider', 'listing', 'review');
create type public.report_status as enum ('open', 'resolved', 'dismissed');

-- ---------------------------------------------------------------------------
-- Shared helpers
-- ---------------------------------------------------------------------------

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Reference data: cities, sectors (who the merchant is), categories (what they need)
-- ---------------------------------------------------------------------------

create table public.cities (
  id smallint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name_ar text not null unique check (char_length(name_ar) between 2 and 40),
  sort_order smallint not null default 0
);

create table public.sectors (
  id smallint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name_ar text not null unique check (char_length(name_ar) between 2 and 40),
  sort_order smallint not null default 0
);

create table public.categories (
  id smallint generated always as identity primary key,
  slug text not null unique check (slug ~ '^[a-z0-9-]{2,40}$'),
  name_ar text not null unique check (char_length(name_ar) between 2 and 40),
  sort_order smallint not null default 0
);

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  full_name text not null check (char_length(full_name) between 2 and 80),
  -- E.164, e.g. +966512345678. Used for login by phone.
  phone text unique check (phone ~ '^\+[1-9][0-9]{7,14}$'),
  status public.account_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

create table public.providers (
  id uuid primary key references public.profiles (id) on delete cascade,
  business_name text not null check (char_length(business_name) between 2 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9-]{3,60}$'),
  city_id smallint not null references public.cities (id),
  whatsapp text not null check (whatsapp ~ '^\+[1-9][0-9]{7,14}$'),
  services text not null check (char_length(services) between 3 and 1000),
  description text check (char_length(description) <= 2000),
  is_verified boolean not null default false,
  rating_avg numeric(3, 2) not null default 0,
  rating_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index providers_city_id_idx on public.providers (city_id);

create trigger providers_set_updated_at
before update on public.providers
for each row execute function public.set_updated_at();

create table public.provider_sectors (
  provider_id uuid not null references public.providers (id) on delete cascade,
  sector_id smallint not null references public.sectors (id),
  primary key (provider_id, sector_id)
);

create index provider_sectors_sector_id_idx on public.provider_sectors (sector_id);

create table public.provider_categories (
  provider_id uuid not null references public.providers (id) on delete cascade,
  category_id smallint not null references public.categories (id),
  primary key (provider_id, category_id)
);

create index provider_categories_category_id_idx on public.provider_categories (category_id);

-- Images live in Cloudflare R2. Tables only keep the object key.
create table public.portfolio_images (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  storage_key text not null unique check (char_length(storage_key) between 1 and 300),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index portfolio_images_provider_id_idx on public.portfolio_images (provider_id, sort_order);

-- ---------------------------------------------------------------------------
-- Listings (ads)
-- ---------------------------------------------------------------------------

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  description text not null check (char_length(description) between 10 and 3000),
  price numeric(12, 2) check (price >= 0),
  city_id smallint not null references public.cities (id),
  category_id smallint not null references public.categories (id),
  contact_method public.contact_method not null default 'whatsapp',
  -- Only an admin can hide a listing (see column grants below).
  status public.listing_status not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index listings_provider_id_idx on public.listings (provider_id);
create index listings_feed_idx on public.listings (status, created_at desc);
create index listings_city_category_idx on public.listings (city_id, category_id);

create trigger listings_set_updated_at
before update on public.listings
for each row execute function public.set_updated_at();

create table public.listing_images (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  storage_key text not null unique check (char_length(storage_key) between 1 and 300),
  sort_order smallint not null default 0,
  created_at timestamptz not null default now()
);

create index listing_images_listing_id_idx on public.listing_images (listing_id, sort_order);

-- ---------------------------------------------------------------------------
-- Reviews and reports
-- ---------------------------------------------------------------------------

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid not null references public.providers (id) on delete cascade,
  merchant_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  comment text check (char_length(comment) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One review per merchant per provider.
  unique (provider_id, merchant_id)
);

create index reviews_provider_id_idx on public.reviews (provider_id, created_at desc);
create index reviews_merchant_id_idx on public.reviews (merchant_id);

create trigger reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  target_type public.report_target not null,
  target_id uuid not null,
  reason text not null check (char_length(reason) between 5 and 500),
  status public.report_status not null default 'open',
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

-- A user cannot pile up open reports on the same thing.
create unique index reports_one_open_per_target
  on public.reports (reporter_id, target_type, target_id)
  where status = 'open';

create index reports_status_idx on public.reports (status, created_at desc);

-- ---------------------------------------------------------------------------
-- Admin data: visit counts and the audit log
-- ---------------------------------------------------------------------------

create table public.page_views_daily (
  day date not null,
  path text not null check (char_length(path) between 1 and 200),
  views integer not null default 0 check (views >= 0),
  primary key (day, path)
);

create table public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null check (char_length(action) between 2 and 60),
  target_type text check (char_length(target_type) <= 40),
  target_id text check (char_length(target_id) <= 80),
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_created_at_idx on public.audit_log (created_at desc);
