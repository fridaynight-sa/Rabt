-- Rabt phase 4: reviews and reports.

-- ---------------------------------------------------------------------------
-- Reviews of one provider, with the reviewer's display name.
-- Profiles are private, so this function returns only the name, never the
-- reviewer's phone or account details. Hidden when the provider is suspended.
-- ---------------------------------------------------------------------------

create function public.get_provider_reviews(
  p_provider_id uuid,
  p_limit integer default 20,
  p_offset integer default 0
)
returns table (
  id uuid,
  rating smallint,
  comment text,
  created_at timestamptz,
  updated_at timestamptz,
  reviewer_name text,
  is_mine boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    r.id, r.rating, r.comment, r.created_at, r.updated_at,
    m.full_name,
    coalesce(r.merchant_id = auth.uid(), false)
  from public.reviews r
  join public.profiles m on m.id = r.merchant_id
  where r.provider_id = p_provider_id
    and public.is_account_active(p_provider_id)
  order by coalesce(r.merchant_id = auth.uid(), false) desc, r.created_at desc, r.id
  limit least(greatest(coalesce(p_limit, 20), 1), 50)
  offset greatest(coalesce(p_offset, 0), 0);
$$;

revoke execute on function public.get_provider_reviews(uuid, integer, integer) from public;
grant execute on function public.get_provider_reviews(uuid, integer, integer) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Reports: let reporters add details without exceeding the reason limit,
-- and stop reports on things that do not exist.
-- ---------------------------------------------------------------------------

create function public.check_report_target()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  found boolean;
begin
  found := case new.target_type
    when 'provider' then exists (select 1 from public.providers where id = new.target_id)
    when 'listing' then exists (select 1 from public.listings where id = new.target_id)
    when 'review' then exists (select 1 from public.reviews where id = new.target_id)
    else false
  end;
  if not found then
    raise exception 'report target does not exist' using errcode = '23503';
  end if;
  return new;
end;
$$;

create trigger reports_check_target
before insert on public.reports
for each row execute function public.check_report_target();

revoke execute on function public.check_report_target() from public, anon, authenticated;
