-- Rabt phase 2: provider pages.

-- ---------------------------------------------------------------------------
-- Image keys must sit in the owner's own folder, so one provider can never
-- point a row at another provider's file.
-- ---------------------------------------------------------------------------

alter table public.portfolio_images
  add constraint portfolio_images_key_in_owner_folder
  check (storage_key like 'portfolio/' || provider_id::text || '/%');

-- ---------------------------------------------------------------------------
-- Replace the sectors and categories a provider serves, all at once.
-- Runs as the caller, so row level security decides what is allowed.
-- ---------------------------------------------------------------------------

create function public.set_provider_tags(p_sector_ids smallint[], p_category_ids smallint[])
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'not signed in' using errcode = '42501';
  end if;

  delete from public.provider_sectors where provider_id = uid;
  delete from public.provider_categories where provider_id = uid;

  insert into public.provider_sectors (provider_id, sector_id)
  select uid, s from unnest(coalesce(p_sector_ids, '{}')) as s group by s;

  insert into public.provider_categories (provider_id, category_id)
  select uid, c from unnest(coalesce(p_category_ids, '{}')) as c group by c;
end;
$$;

revoke execute on function public.set_provider_tags(smallint[], smallint[]) from public, anon;
grant execute on function public.set_provider_tags(smallint[], smallint[]) to authenticated;
