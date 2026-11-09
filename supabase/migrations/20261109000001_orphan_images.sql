-- Rabt: find image files that no listing or portfolio row points to any more
-- (an upload whose save failed, or a file uploaded straight to Storage).
-- Used by the weekly clean-up (.github/workflows/cleanup-images.yml), which
-- deletes them through the Storage API. Server only.

create function public.orphan_media_files(p_min_age interval default interval '1 day', p_limit integer default 500)
returns table (name text)
language sql
stable
security definer
set search_path = ''
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'rabt-media'
    -- Skip fresh files: an upload may still be waiting for its row.
    and o.created_at < now() - greatest(p_min_age, interval '1 hour')
    and not exists (select 1 from public.portfolio_images p where p.storage_key = o.name)
    and not exists (select 1 from public.listing_images l where l.storage_key = o.name)
  order by o.created_at
  limit least(greatest(coalesce(p_limit, 500), 1), 1000);
$$;

revoke execute on function public.orphan_media_files(interval, integer) from public, anon, authenticated;
grant execute on function public.orphan_media_files(interval, integer) to service_role;
