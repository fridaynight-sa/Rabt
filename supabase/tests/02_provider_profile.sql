-- Phase 2 tests: provider page editing and portfolio images.
-- Uses the accounts created in 01_security.sql.

\set m2 '''22222222-2222-2222-2222-222222222222'''
\set p1 '''33333333-3333-3333-3333-333333333333'''
\set p2 '''44444444-4444-4444-4444-444444444444'''

-- ---------------------------------------------------------------------------
-- Sectors and categories
-- ---------------------------------------------------------------------------

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:p1::text)), false);

select public.set_provider_tags(array[1, 2, 2]::smallint[], array[3, 4]::smallint[]);
select tests.ok(tests.rows(format('select * from public.provider_sectors where provider_id = %L', :p1)) = 2, 'provider saves sectors (duplicates ignored)');
select tests.ok(tests.rows(format('select * from public.provider_categories where provider_id = %L', :p1)) = 2, 'provider saves categories, replacing the old ones');

select public.set_provider_tags(array[]::smallint[], array[5]::smallint[]);
select tests.ok(tests.rows(format('select * from public.provider_sectors where provider_id = %L', :p1)) = 0, 'provider clears sectors');

select tests.throws($$select public.set_provider_tags(array[999]::smallint[], array[]::smallint[])$$, '23503', 'unknown sector is rejected');
reset role;

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:m2::text)), false);
select tests.throws($$select public.set_provider_tags(array[1]::smallint[], array[1]::smallint[])$$, '42501', 'a merchant cannot set provider tags');
reset role;

set role anon;
select set_config('request.jwt.claims', '', false);
select tests.throws($$select public.set_provider_tags(array[1]::smallint[], array[1]::smallint[])$$, '42501', 'a visitor cannot set provider tags');
select tests.ok(tests.rows(format('select * from public.provider_categories where provider_id = %L', :p1)) = 1, 'visitors see a provider''s categories');
reset role;

-- ---------------------------------------------------------------------------
-- Portfolio images
-- ---------------------------------------------------------------------------

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:p1::text)), false);

select tests.ok(tests.rows(format(
  'insert into public.portfolio_images (provider_id, storage_key) values (%L, %L) returning 1',
  :p1, 'portfolio/' || :p1 || '/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa.webp')) = 1,
  'provider adds a portfolio image in their own folder');
select tests.throws(format(
  'insert into public.portfolio_images (provider_id, storage_key) values (%L, %L)',
  :p1, 'portfolio/' || :p2 || '/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb.webp'),
  '23514', 'provider cannot point an image at another provider''s folder');
select tests.throws(format(
  'insert into public.portfolio_images (provider_id, storage_key) values (%L, %L)',
  :p1, 'listings/x.webp'),
  '23514', 'provider cannot point an image outside the portfolio folder');
select tests.throws(format(
  'insert into public.portfolio_images (provider_id, storage_key) values (%L, %L)',
  :p2, 'portfolio/' || :p2 || '/cccccccc-cccc-cccc-cccc-cccccccccccc.webp'),
  '42501', 'provider cannot add images to another provider''s portfolio');
reset role;

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:p2::text)), false);
select tests.ok(tests.rows(format('delete from public.portfolio_images where provider_id = %L returning 1', :p1)) = 0, 'provider cannot delete another provider''s images');
reset role;

set role anon;
select set_config('request.jwt.claims', '', false);
select tests.ok(tests.rows('select * from public.portfolio_images') = 1, 'visitors see portfolio images');
reset role;

-- Portfolio limit (30).
insert into public.portfolio_images (provider_id, storage_key)
select :p1, 'portfolio/' || :p1 || '/' || gen_random_uuid() || '.webp' from generate_series(1, 29);
select tests.throws(format(
  'insert into public.portfolio_images (provider_id, storage_key) values (%L, %L)',
  :p1, 'portfolio/' || :p1 || '/dddddddd-dddd-dddd-dddd-dddddddddddd.webp'),
  '23514', 'a portfolio cannot have more than 30 images');
