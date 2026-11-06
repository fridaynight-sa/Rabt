-- Rabt: provider and listing images in Supabase Storage (bucket "rabt-media").
--
-- Same rules as before, now enforced by Storage itself:
--   portfolio/<provider id>/<file>  only that provider writes or deletes
--   listings/<listing id>/<file>    only the provider who owns that listing
-- The bucket is public for reading (file names are random), 3 MB per file,
-- JPEG, PNG and WebP only. Nobody can overwrite a file (no update policy).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('rabt-media', 'rabt-media', true, 3145728, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- May the signed-in user write (or delete) a file at this path?
create function public.can_write_media(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    p_name ~ '^(portfolio|listings)/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$'
    and public.current_user_role() = 'provider'
    and case split_part(p_name, '/', 1)
      when 'portfolio' then split_part(p_name, '/', 2) = auth.uid()::text
      when 'listings' then exists (
        select 1 from public.listings l
        where l.id::text = split_part(p_name, '/', 2) and l.provider_id = auth.uid()
      )
      else false
    end,
    false
  );
$$;

revoke execute on function public.can_write_media(text) from public, anon;
grant execute on function public.can_write_media(text) to authenticated;

create policy "rabt-media: owners upload" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'rabt-media' and public.can_write_media(name));

create policy "rabt-media: owners see their files" on storage.objects
  for select to authenticated
  using (bucket_id = 'rabt-media' and public.can_write_media(name));

create policy "rabt-media: owners delete" on storage.objects
  for delete to authenticated
  using (bucket_id = 'rabt-media' and public.can_write_media(name));
