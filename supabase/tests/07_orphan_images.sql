-- Weekly image clean-up: which files count as orphans.

\set p2 '''44444444-4444-4444-4444-444444444444'''

delete from storage.objects;
insert into storage.buckets (id, name) values ('other-bucket', 'other-bucket') on conflict do nothing;
insert into storage.objects (bucket_id, name, created_at) values
  ('rabt-media', 'portfolio/' || :p2 || '/aaaaaaaa-1111-4000-8000-000000000001.webp', now() - interval '3 days'),
  ('rabt-media', 'portfolio/' || :p2 || '/aaaaaaaa-1111-4000-8000-000000000002.webp', now() - interval '3 days'),
  ('rabt-media', 'portfolio/' || :p2 || '/aaaaaaaa-1111-4000-8000-000000000003.webp', now() - interval '10 minutes'),
  ('other-bucket', 'x/old-file.webp', now() - interval '3 days');

-- The first file is in use by a portfolio row.
insert into public.portfolio_images (provider_id, storage_key)
values (:p2, 'portfolio/' || :p2 || '/aaaaaaaa-1111-4000-8000-000000000001.webp')
on conflict do nothing;

set role service_role;
select tests.ok(
  (select array_agg(name) from public.orphan_media_files())::text
  = '{portfolio/' || :p2 || '/aaaaaaaa-1111-4000-8000-000000000002.webp}',
  'only old files in rabt-media that nothing points to are orphans');
select tests.ok(
  (select count(*) from public.orphan_media_files(interval '1 minute')) = 1,
  'files younger than an hour are always left alone');
reset role;

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s,"aal":"aal2"}', to_json('55555555-5555-5555-5555-555555555555'::text)), false);
select tests.throws('select * from public.orphan_media_files()', '42501', 'even the admin cannot list orphans from the browser');
reset role;
