-- Image store tests (Supabase Storage bucket "rabt-media").
-- From earlier files: p1, p2 providers; m2 merchant; listing l1 belongs to p1.

\set m2 '''22222222-2222-2222-2222-222222222222'''
\set p1 '''33333333-3333-3333-3333-333333333333'''
\set p2 '''44444444-4444-4444-4444-444444444444'''
\set l1 '''aaaaaaaa-0000-0000-0000-000000000001'''
\set f1 '''bbbbbbbb-0000-4000-8000-000000000001'''

select tests.ok(
  (select public and file_size_limit = 3145728 and allowed_mime_types = array['image/jpeg','image/png','image/webp']
   from storage.buckets where id = 'rabt-media'),
  'the bucket is public for reading, 3 MB per file, images only');

-- Provider p1
set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:p1::text)), false);

select tests.ok(tests.rows(format(
  'insert into storage.objects (bucket_id, name) values (''rabt-media'', %L) returning 1',
  'portfolio/' || :p1 || '/' || :f1 || '.webp')) = 1, 'a provider uploads to their own portfolio folder');
select tests.ok(tests.rows(format(
  'insert into storage.objects (bucket_id, name) values (''rabt-media'', %L) returning 1',
  'listings/' || :l1 || '/' || :f1 || '.webp')) = 1, 'a provider uploads to their own listing folder');
select tests.throws(format(
  'insert into storage.objects (bucket_id, name) values (''rabt-media'', %L)',
  'portfolio/' || :p2 || '/' || :f1 || '.webp'), '42501', 'a provider cannot upload to another provider''s folder');
select tests.throws(format(
  'insert into storage.objects (bucket_id, name) values (''rabt-media'', %L)',
  'portfolio/' || :p1 || '/evil.svg'), '42501', 'only site-made file names are accepted');
select tests.throws(format(
  'insert into storage.objects (bucket_id, name) values (''rabt-media'', %L)',
  'portfolio/' || :p1 || '/../' || :f1 || '.webp'), '42501', 'paths that climb folders are refused');
select tests.throws(format(
  'insert into storage.objects (bucket_id, name) values (''other-bucket'', %L)',
  'portfolio/' || :p1 || '/' || :f1 || '.png'), '42501', 'other buckets are closed');
reset role;

-- Provider p2: cannot touch p1's files or listing.
set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:p2::text)), false);
select tests.throws(format(
  'insert into storage.objects (bucket_id, name) values (''rabt-media'', %L)',
  'listings/' || :l1 || '/cccccccc-0000-4000-8000-000000000001.webp'), '42501', 'a provider cannot add images to another provider''s listing');
select tests.ok(tests.rows(format(
  'delete from storage.objects where name = %L returning 1',
  'portfolio/' || :p1 || '/' || :f1 || '.webp')) = 0, 'a provider cannot delete another provider''s image');
reset role;

-- Merchant and visitor: no uploads.
set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:m2::text)), false);
select tests.throws(format(
  'insert into storage.objects (bucket_id, name) values (''rabt-media'', %L)',
  'portfolio/' || :m2 || '/' || :f1 || '.webp'), '42501', 'a merchant cannot upload images');
reset role;

set role anon;
select set_config('request.jwt.claims', '', false);
select tests.throws(format(
  'insert into storage.objects (bucket_id, name) values (''rabt-media'', %L)',
  'portfolio/' || :p1 || '/dddddddd-0000-4000-8000-000000000001.webp'), '42501', 'visitors cannot upload images');
reset role;

-- Suspended provider: no uploads.
update public.profiles set status = 'suspended' where id = :p1;
set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:p1::text)), false);
select tests.throws(format(
  'insert into storage.objects (bucket_id, name) values (''rabt-media'', %L)',
  'portfolio/' || :p1 || '/eeeeeeee-0000-4000-8000-000000000001.webp'), '42501', 'a suspended provider cannot upload images');
reset role;
update public.profiles set status = 'active' where id = :p1;

-- Owner deletes their own files.
set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:p1::text)), false);
select tests.ok(tests.rows(format(
  'delete from storage.objects where bucket_id = ''rabt-media'' and name in (%L, %L) returning 1',
  'portfolio/' || :p1 || '/' || :f1 || '.webp', 'listings/' || :l1 || '/' || :f1 || '.webp')) = 2,
  'a provider deletes their own images');
insert into storage.objects (bucket_id, name) values ('rabt-media', 'portfolio/' || :p1 || '/' || :f1 || '.png');
select tests.ok(tests.rows(format(
  'update storage.objects set name = %L where bucket_id = ''rabt-media'' returning 1',
  'portfolio/' || :p1 || '/ffffffff-0000-4000-8000-000000000001.png')) = 0,
  'nobody can rename or overwrite files');
reset role;
