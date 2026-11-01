-- Phase 3 tests: listing images and search.
-- Uses the accounts and data from the earlier test files:
--   p1 (active, Riyadh) has listing aaaa... "مكينة إسبريسو" (12000), rating 4.50
--   p2 (active, Jeddah) "شركة الأثاث"

\set p1 '''33333333-3333-3333-3333-333333333333'''
\set p2 '''44444444-4444-4444-4444-444444444444'''
\set l1 '''aaaaaaaa-0000-0000-0000-000000000001'''

-- ---------------------------------------------------------------------------
-- Listing image keys
-- ---------------------------------------------------------------------------

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:p2::text)), false);
insert into public.listings (provider_id, title, description, price, city_id, category_id)
values (:p2, 'طاولات مقهى خشب', 'طاولات خشب طبيعي للمقاهي والمطاعم', 500, 2, 2);
insert into public.listings (provider_id, title, description, city_id, category_id, contact_method)
values (:p2, 'كراسي مطاعم', 'كراسي معدن مريحة، السعر حسب الكمية', 2, 2, 'call');

select tests.throws(
  format($$insert into public.listing_images (listing_id, storage_key)
           select id, 'listings/' || %L || '/x.webp' from public.listings where title = 'كراسي مطاعم'$$, :l1),
  '23514', 'a listing image must sit in its own listing''s folder');
reset role;

-- ---------------------------------------------------------------------------
-- Search listings (as a visitor)
-- ---------------------------------------------------------------------------

set role anon;
select set_config('request.jwt.claims', '', false);

select tests.ok(tests.rows('select * from public.search_listings()') = 3, 'visitor sees all published listings');
select tests.ok((select total_count from public.search_listings(p_limit => 1) limit 1) = 3, 'total count ignores the page size');
select tests.ok(tests.rows('select * from public.search_listings(p_limit => 1, p_offset => 1)') = 1, 'pages work');

select tests.ok(tests.rows($$select * from public.search_listings('اسبريسو')$$) = 1, 'search ignores hamza on alef');
select tests.ok(tests.rows($$select * from public.search_listings('مكينه')$$) = 1, 'search treats ة and ه alike');
select tests.ok(tests.rows($$select * from public.search_listings('  إسبريسو  ')$$) = 1, 'search trims spaces');
select tests.ok(tests.rows($$select * from public.search_listings('المعدات')$$) = 1, 'search matches the provider name');
select tests.ok(tests.rows($$select * from public.search_listings('%')$$) = 0, 'a % in the search is a plain character');
select tests.ok(tests.rows($$select * from public.search_listings('_')$$) = 0, 'an _ in the search is a plain character');
select tests.ok(tests.rows($$select * from public.search_listings('')$$) = 3, 'an empty search returns everything');

select tests.ok(tests.rows('select * from public.search_listings(p_city_id => 2::smallint)') = 2, 'filter by city');
select tests.ok(tests.rows('select * from public.search_listings(p_category_id => 1::smallint)') = 1, 'filter by category');
select tests.ok(tests.rows(format('select * from public.search_listings(p_provider_id => %L)', :p2)) = 2, 'filter by provider');
select tests.ok(tests.rows('select * from public.search_listings(p_sector_id => 1::smallint)') = 0, 'filter by sector (nobody serves it yet)');

select tests.ok(
  (select array_agg(price::int)::text from public.search_listings(p_sort => 'price_low'))
  = '{500,12000,NULL}', 'sort by lowest price, no price last');
select tests.ok(
  (select array_agg(price::int)::text from public.search_listings(p_sort => 'price_high'))
  = '{12000,500,NULL}', 'sort by highest price, no price last');

select tests.ok(
  (select cover_key from public.search_listings('اسبريسو')) like 'listings/' || :l1 || '/%',
  'each result carries its first image');
select tests.ok(
  (select cover_key from public.search_listings('كراسي')) is null,
  'a listing without images has no cover');
select tests.ok(tests.rows('select * from public.search_listings(p_limit => 1000)') <= 50, 'page size is capped at 50');
reset role;

-- Sector filter once a provider serves the sector.
insert into public.provider_sectors (provider_id, sector_id) values (:p2, 1);
set role anon;
select tests.ok(tests.rows('select * from public.search_listings(p_sector_id => 1::smallint)') = 2, 'filter by the sector a provider serves');
reset role;

-- Hidden listings and suspended providers never show, even to the owner.
update public.listings set status = 'hidden' where id = :l1;
set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:p1::text)), false);
select tests.ok(tests.rows($$select * from public.search_listings('اسبريسو')$$) = 0, 'hidden listings are not in search, even for the owner');
reset role;
update public.listings set status = 'published' where id = :l1;

update public.profiles set status = 'suspended' where id = :p2;
set role anon;
select set_config('request.jwt.claims', '', false);
select tests.ok(tests.rows('select * from public.search_listings()') = 1, 'a suspended provider''s listings are not in search');
select tests.ok(tests.rows('select * from public.search_providers()') = 1, 'a suspended provider is not in provider search');
reset role;
update public.profiles set status = 'active' where id = :p2;

-- ---------------------------------------------------------------------------
-- Search providers
-- ---------------------------------------------------------------------------

set role anon;
select set_config('request.jwt.claims', '', false);
select tests.ok((select slug from public.search_providers() limit 1) = (select slug from public.providers where id = :p1), 'providers sort by rating by default');
select tests.ok(tests.rows($$select * from public.search_providers('اثاث')$$) = 1, 'provider search ignores hamza');
select tests.ok(tests.rows('select * from public.search_providers(p_city_id => 2::smallint)') = 1, 'provider search filters by city');
select tests.ok(tests.rows('select * from public.search_providers(p_category_id => 5::smallint)') = 1, 'provider search filters by category');
select tests.ok(tests.rows('select * from public.search_providers(p_sector_id => 1::smallint)') = 1, 'provider search filters by sector');
select tests.ok((select cover_key from public.search_providers('المعدات')) like 'portfolio/%', 'each provider carries a cover image');
reset role;
