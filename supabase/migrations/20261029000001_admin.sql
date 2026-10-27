-- Rabt phase 5: admin.
--
-- Admin powers need the second login step (an authenticator code, "aal2").
-- Every admin change goes through a function below that checks this and
-- writes the audit log in the same transaction.

-- ---------------------------------------------------------------------------
-- Admin = admin role, active account, and the second login step done.
-- ---------------------------------------------------------------------------

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    public.current_user_role() = 'admin' and (auth.jwt() ->> 'aal') = 'aal2',
    false
  );
$$;

create function public.require_admin()
returns uuid
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'admin only' using errcode = '42501';
  end if;
  return auth.uid();
end;
$$;

create function public.write_audit(
  p_action text,
  p_target_type text,
  p_target_id text,
  p_details jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.audit_log (actor_id, action, target_type, target_id, details)
  values (auth.uid(), p_action, p_target_type, p_target_id, coalesce(p_details, '{}'::jsonb));
$$;

-- ---------------------------------------------------------------------------
-- Accounts
-- ---------------------------------------------------------------------------

-- Accounts with their email (from the auth schema), for the admin list.
create function public.admin_list_accounts(
  p_role public.user_role default null,
  p_status public.account_status default null,
  p_query text default null,
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  role public.user_role,
  full_name text,
  email text,
  phone text,
  status public.account_status,
  created_at timestamptz,
  provider_slug text,
  provider_verified boolean,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  return query
    select
      p.id, p.role, p.full_name, u.email::text, coalesce(p.phone, pr.whatsapp), p.status, p.created_at,
      pr.slug, pr.is_verified,
      count(*) over ()
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.providers pr on pr.id = p.id
    where (p_role is null or p.role = p_role)
      and (p_status is null or p.status = p_status)
      and (public.search_pattern(p_query) is null
           or public.normalize_search_text(p.full_name) like public.search_pattern(p_query)
           or lower(u.email::text) like '%' || lower(btrim(p_query)) || '%'
           or coalesce(p.phone, pr.whatsapp, '') like '%' || btrim(p_query) || '%')
    order by p.created_at desc, p.id
    limit least(greatest(coalesce(p_limit, 50), 1), 100)
    offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

-- Suspend or reactivate an account. Admins cannot suspend themselves or other admins.
create function public.admin_set_account_status(p_user_id uuid, p_status public.account_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public.require_admin();
  target_role public.user_role;
begin
  select role into target_role from public.profiles where id = p_user_id;
  if target_role is null then
    raise exception 'account not found' using errcode = 'P0002';
  end if;
  if p_user_id = me or target_role = 'admin' then
    raise exception 'cannot change an admin account' using errcode = '42501';
  end if;
  update public.profiles set status = p_status where id = p_user_id;
  perform public.write_audit(
    case when p_status = 'suspended' then 'account.suspend' else 'account.activate' end,
    'account', p_user_id::text);
end;
$$;

create function public.admin_set_provider_verified(p_provider_id uuid, p_verified boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  update public.providers set is_verified = p_verified where id = p_provider_id;
  if not found then
    raise exception 'provider not found' using errcode = 'P0002';
  end if;
  perform public.write_audit(
    case when p_verified then 'provider.verify' else 'provider.unverify' end,
    'account', p_provider_id::text);
end;
$$;

-- Logs an admin action done outside the database (creating or deleting a
-- login through the Supabase admin API). Refuses anyone who is not admin.
create function public.admin_log(p_action text, p_target_type text, p_target_id text, p_details jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  if p_action not in ('account.create', 'account.delete') then
    raise exception 'unknown action' using errcode = '22023';
  end if;
  perform public.write_audit(p_action, p_target_type, p_target_id, p_details);
end;
$$;

-- ---------------------------------------------------------------------------
-- Content
-- ---------------------------------------------------------------------------

create function public.admin_set_listing_status(p_listing_id uuid, p_status public.listing_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  update public.listings set status = p_status where id = p_listing_id;
  if not found then
    raise exception 'listing not found' using errcode = 'P0002';
  end if;
  perform public.write_audit(
    case when p_status = 'hidden' then 'listing.hide' else 'listing.show' end,
    'listing', p_listing_id::text);
end;
$$;

create function public.admin_delete_review(p_review_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  removed public.reviews;
begin
  perform public.require_admin();
  delete from public.reviews where id = p_review_id returning * into removed;
  if removed.id is null then
    raise exception 'review not found' using errcode = 'P0002';
  end if;
  perform public.write_audit('review.delete', 'review', p_review_id::text,
    jsonb_build_object('provider_id', removed.provider_id, 'rating', removed.rating, 'comment', removed.comment));
end;
$$;

create function public.admin_resolve_report(p_report_id uuid, p_status public.report_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  me uuid := public.require_admin();
begin
  if p_status = 'open' then
    raise exception 'use resolved or dismissed' using errcode = '22023';
  end if;
  update public.reports
  set status = p_status, resolved_by = me, resolved_at = now()
  where id = p_report_id and status = 'open';
  if not found then
    raise exception 'open report not found' using errcode = 'P0002';
  end if;
  perform public.write_audit('report.' || p_status::text, 'report', p_report_id::text);
end;
$$;

-- Reports with who sent them and a label and link for what they point at.
create function public.admin_list_reports(
  p_status public.report_status default 'open',
  p_limit integer default 50,
  p_offset integer default 0
)
returns table (
  id uuid,
  target_type public.report_target,
  target_id uuid,
  target_label text,
  target_path text,
  target_owner_id uuid,
  reason text,
  status public.report_status,
  created_at timestamptz,
  reporter_name text,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  perform public.require_admin();
  return query
    select
      r.id, r.target_type, r.target_id,
      case r.target_type
        when 'provider' then pr.business_name
        when 'listing' then l.title
        when 'review' then left(coalesce(rv.comment, '★' || rv.rating::text), 120)
      end,
      case r.target_type
        when 'provider' then '/providers/' || pr.slug
        when 'listing' then '/listings/' || l.id::text
        when 'review' then '/providers/' || rpr.slug || '#reviews'
      end,
      case r.target_type
        when 'provider' then pr.id
        when 'listing' then l.provider_id
        when 'review' then rv.merchant_id
      end,
      r.reason, r.status, r.created_at,
      rep.full_name,
      count(*) over ()
    from public.reports r
    join public.profiles rep on rep.id = r.reporter_id
    left join public.providers pr on r.target_type = 'provider' and pr.id = r.target_id
    left join public.listings l on r.target_type = 'listing' and l.id = r.target_id
    left join public.reviews rv on r.target_type = 'review' and rv.id = r.target_id
    left join public.providers rpr on rpr.id = rv.provider_id
    where p_status is null or r.status = p_status
    order by r.created_at desc, r.id
    limit least(greatest(coalesce(p_limit, 50), 1), 100)
    offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

-- ---------------------------------------------------------------------------
-- Cities, sectors and categories: add (p_id null) or rename.
-- ---------------------------------------------------------------------------

create function public.admin_save_reference(
  p_kind text,
  p_id smallint,
  p_slug text,
  p_name_ar text,
  p_sort_order smallint default 0
)
returns smallint
language plpgsql
security definer
set search_path = ''
as $$
declare
  saved smallint;
begin
  perform public.require_admin();
  if p_kind not in ('cities', 'sectors', 'categories') then
    raise exception 'unknown list' using errcode = '22023';
  end if;
  if p_id is null then
    execute format(
      'insert into public.%I (slug, name_ar, sort_order) values ($1, $2, $3) returning id', p_kind)
      into saved using p_slug, p_name_ar, coalesce(p_sort_order, 0);
  else
    execute format(
      'update public.%I set slug = $1, name_ar = $2, sort_order = $3 where id = $4 returning id', p_kind)
      into saved using p_slug, p_name_ar, coalesce(p_sort_order, 0), p_id;
    if saved is null then
      raise exception 'item not found' using errcode = 'P0002';
    end if;
  end if;
  perform public.write_audit(
    case when p_id is null then 'reference.add' else 'reference.rename' end,
    p_kind, saved::text, jsonb_build_object('slug', p_slug, 'name_ar', p_name_ar));
  return saved;
end;
$$;

-- ---------------------------------------------------------------------------
-- Numbers for the admin home page.
-- ---------------------------------------------------------------------------

create function public.admin_stats(p_days integer default 30)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  days integer := least(greatest(coalesce(p_days, 30), 1), 365);
  since date := (now() at time zone 'Asia/Riyadh')::date - (days - 1);
begin
  perform public.require_admin();
  return jsonb_build_object(
    'merchants', (select count(*) from public.profiles where role = 'merchant'),
    'providers', (select count(*) from public.profiles where role = 'provider'),
    'suspended', (select count(*) from public.profiles where status = 'suspended'),
    'new_accounts', (select count(*) from public.profiles where created_at >= since),
    'listings', (select count(*) from public.listings where status = 'published'),
    'hidden_listings', (select count(*) from public.listings where status = 'hidden'),
    'reviews', (select count(*) from public.reviews),
    'open_reports', (select count(*) from public.reports where status = 'open'),
    'views_total', (select coalesce(sum(views), 0) from public.page_views_daily where day >= since),
    'views_by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', d.day::date, 'views', coalesce(v.views, 0)) order by d.day), '[]'::jsonb)
      from generate_series(since, since + (days - 1), interval '1 day') as d(day)
      left join (
        select day, sum(views) as views from public.page_views_daily where day >= since group by day
      ) v on v.day = d.day::date
    ),
    'top_pages', (
      select coalesce(jsonb_agg(jsonb_build_object('path', path, 'views', views) order by views desc), '[]'::jsonb)
      from (
        select path, sum(views) as views from public.page_views_daily
        where day >= since group by path order by sum(views) desc limit 10
      ) t
    )
  );
end;
$$;

-- ---------------------------------------------------------------------------
-- Privileges: the browser may call the admin_* functions (they check admin
-- themselves); the helpers stay internal.
-- ---------------------------------------------------------------------------

revoke execute on function public.require_admin() from public, anon, authenticated;
revoke execute on function public.write_audit(text, text, text, jsonb) from public, anon, authenticated;

revoke execute on function public.admin_list_accounts(public.user_role, public.account_status, text, integer, integer) from public, anon;
revoke execute on function public.admin_set_account_status(uuid, public.account_status) from public, anon;
revoke execute on function public.admin_set_provider_verified(uuid, boolean) from public, anon;
revoke execute on function public.admin_log(text, text, text, jsonb) from public, anon;
revoke execute on function public.admin_set_listing_status(uuid, public.listing_status) from public, anon;
revoke execute on function public.admin_delete_review(uuid) from public, anon;
revoke execute on function public.admin_resolve_report(uuid, public.report_status) from public, anon;
revoke execute on function public.admin_list_reports(public.report_status, integer, integer) from public, anon;
revoke execute on function public.admin_save_reference(text, smallint, text, text, smallint) from public, anon;
revoke execute on function public.admin_stats(integer) from public, anon;

grant execute on function public.admin_list_accounts(public.user_role, public.account_status, text, integer, integer) to authenticated;
grant execute on function public.admin_set_account_status(uuid, public.account_status) to authenticated;
grant execute on function public.admin_set_provider_verified(uuid, boolean) to authenticated;
grant execute on function public.admin_log(text, text, text, jsonb) to authenticated;
grant execute on function public.admin_set_listing_status(uuid, public.listing_status) to authenticated;
grant execute on function public.admin_delete_review(uuid) to authenticated;
grant execute on function public.admin_resolve_report(uuid, public.report_status) to authenticated;
grant execute on function public.admin_list_reports(public.report_status, integer, integer) to authenticated;
grant execute on function public.admin_save_reference(text, smallint, text, text, smallint) to authenticated;
grant execute on function public.admin_stats(integer) to authenticated;
