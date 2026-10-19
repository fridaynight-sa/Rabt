-- Rabt: database functions and triggers.
-- SECURITY DEFINER functions run with the owner's rights, so each one pins
-- search_path to '' and checks its own inputs.

-- ---------------------------------------------------------------------------
-- Who is calling? Used by row level security policies.
-- ---------------------------------------------------------------------------

-- Role of the signed-in user, or null when signed out or suspended.
create function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid() and p.status = 'active';
$$;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

-- True when the account exists and is not suspended.
create function public.is_account_active(account_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = account_id and p.status = 'active'
  );
$$;

-- ---------------------------------------------------------------------------
-- Sign up: create the profile (and provider row) from the sign-up form data.
-- The form data is user controlled, so everything is checked here again.
-- Nobody can sign up as admin.
-- ---------------------------------------------------------------------------

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  account_type text := meta ->> 'account_type';
  v_full_name text := btrim(meta ->> 'full_name');
  v_phone text := nullif(btrim(meta ->> 'phone'), '');
  v_city_id smallint;
begin
  if account_type = 'merchant' then
    insert into public.profiles (id, role, full_name, phone)
    values (new.id, 'merchant', v_full_name, v_phone);

  elsif account_type = 'provider' then
    begin
      v_city_id := (meta ->> 'city_id')::smallint;
    exception when others then
      raise exception 'invalid city_id' using errcode = '22023';
    end;

    insert into public.profiles (id, role, full_name)
    values (new.id, 'provider', v_full_name);

    insert into public.providers (id, business_name, slug, city_id, whatsapp, services)
    values (
      new.id,
      v_full_name,
      'p-' || substr(replace(new.id::text, '-', ''), 1, 12),
      v_city_id,
      btrim(meta ->> 'whatsapp'),
      btrim(meta ->> 'services')
    );

  else
    raise exception 'account_type must be merchant or provider' using errcode = '22023';
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Keep each provider's rating average and count up to date.
-- ---------------------------------------------------------------------------

create function public.refresh_provider_rating()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  target uuid;
begin
  foreach target in array array[
    case when tg_op <> 'INSERT' then old.provider_id end,
    case when tg_op <> 'DELETE' then new.provider_id end
  ]
  loop
    continue when target is null;
    update public.providers p
    set rating_avg = coalesce(s.avg_rating, 0),
        rating_count = s.total
    from (
      select round(avg(r.rating)::numeric, 2) as avg_rating, count(*)::integer as total
      from public.reviews r
      where r.provider_id = target
    ) s
    where p.id = target;
  end loop;
  return null;
end;
$$;

create trigger reviews_refresh_provider_rating
after insert or update of rating, provider_id or delete on public.reviews
for each row execute function public.refresh_provider_rating();

-- ---------------------------------------------------------------------------
-- Image limits: 5 per listing, 30 per provider portfolio.
-- The parent row is locked so two uploads at once cannot both slip through.
-- ---------------------------------------------------------------------------

create function public.enforce_listing_image_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.listings where id = new.listing_id for update;
  if (select count(*) from public.listing_images where listing_id = new.listing_id) >= 5 then
    raise exception 'a listing can have at most 5 images' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger listing_images_limit
before insert on public.listing_images
for each row execute function public.enforce_listing_image_limit();

create function public.enforce_portfolio_image_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1 from public.providers where id = new.provider_id for update;
  if (select count(*) from public.portfolio_images where provider_id = new.provider_id) >= 30 then
    raise exception 'a portfolio can have at most 30 images' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger portfolio_images_limit
before insert on public.portfolio_images
for each row execute function public.enforce_portfolio_image_limit();

-- ---------------------------------------------------------------------------
-- Server-only helpers (service role). Not callable from the browser.
-- ---------------------------------------------------------------------------

-- Login by phone: find the email that belongs to an active account's phone.
create function public.get_login_email_for_phone(p_phone text)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select u.email::text
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.phone = p_phone and p.status = 'active';
$$;

-- Count one page view for today.
create function public.record_page_view(p_path text)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.page_views_daily (day, path, views)
  values ((now() at time zone 'Asia/Riyadh')::date, left(p_path, 200), 1)
  on conflict (day, path) do update set views = public.page_views_daily.views + 1;
$$;

-- ---------------------------------------------------------------------------
-- Function privileges: nothing is callable unless granted here.
-- ---------------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon, authenticated;

grant execute on function public.current_user_role() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.is_account_active(uuid) to anon, authenticated;

grant execute on function public.get_login_email_for_phone(text) to service_role;
grant execute on function public.record_page_view(text) to service_role;
