-- Security tests: each role can only see and change what it should.
-- Run with: npm run test:db

-- ---------------------------------------------------------------------------
-- Test helpers
-- ---------------------------------------------------------------------------

create schema tests;
grant usage on schema tests to anon, authenticated, service_role;

create function tests.ok(cond boolean, msg text)
returns void
language plpgsql
as $$
begin
  if cond is not true then
    raise exception 'FAIL: %', msg;
  end if;
  raise notice 'ok - %', msg;
end;
$$;

-- Runs a statement and expects it to fail with the given SQLSTATE.
create function tests.throws(stmt text, expected_state text, msg text)
returns void
language plpgsql
as $$
begin
  begin
    execute stmt;
  exception when others then
    if sqlstate = expected_state then
      raise notice 'ok - %', msg;
      return;
    end if;
    raise exception 'FAIL: % (got % %)', msg, sqlstate, sqlerrm;
  end;
  raise exception 'FAIL: % (no error)', msg;
end;
$$;

-- Number of rows a query returns for the current role.
create function tests.rows(query text)
returns bigint
language plpgsql
as $$
declare
  n bigint;
begin
  execute format('with t as (%s) select count(*) from t', query) into n;
  return n;
end;
$$;

grant execute on all functions in schema tests to anon, authenticated, service_role;

-- Test accounts
--   m1, m2 = merchants    p1, p2 = providers    a1 = admin
\set m1 '''11111111-1111-1111-1111-111111111111'''
\set m2 '''22222222-2222-2222-2222-222222222222'''
\set p1 '''33333333-3333-3333-3333-333333333333'''
\set p2 '''44444444-4444-4444-4444-444444444444'''
\set a1 '''55555555-5555-5555-5555-555555555555'''

-- ---------------------------------------------------------------------------
-- Sign up creates the right rows, and rejects bad data
-- ---------------------------------------------------------------------------

insert into auth.users (id, email, raw_user_meta_data) values
  (:m1, 'm1@example.com', '{"account_type":"merchant","full_name":"مقهى الورد","phone":"+966500000001"}'),
  (:m2, 'm2@example.com', '{"account_type":"merchant","full_name":"مطعم السفرة"}'),
  (:p1, 'p1@example.com', '{"account_type":"provider","full_name":"مؤسسة المعدات","city_id":"1","whatsapp":"+966500000003","services":"معدات قهوة"}'),
  (:p2, 'p2@example.com', '{"account_type":"provider","full_name":"شركة الأثاث","city_id":"2","whatsapp":"+966500000004","services":"أثاث مطاعم"}'),
  (:a1, 'a1@example.com', '{"account_type":"merchant","full_name":"المدير"}');

-- The admin is promoted directly in the database (see docs/SECURITY.md).
update public.profiles set role = 'admin' where id = :a1;

select tests.ok((select role from public.profiles where id = :m1) = 'merchant', 'merchant sign up creates a merchant profile');
select tests.ok((select phone from public.profiles where id = :m1) = '+966500000001', 'merchant phone is saved');
select tests.ok((select count(*) from public.providers where id = :p1) = 1, 'provider sign up creates a provider page');
select tests.ok((select slug from public.providers where id = :p1) ~ '^p-[0-9a-f]{12}$', 'provider gets a generated page link');

select tests.throws(
  $$insert into auth.users (email, raw_user_meta_data) values ('x1@example.com', '{"account_type":"admin","full_name":"هاكر"}')$$,
  '22023', 'nobody can sign up as admin');
select tests.throws(
  $$insert into auth.users (email, raw_user_meta_data) values ('x2@example.com', '{"full_name":"بدون نوع"}')$$,
  '22023', 'sign up without an account type is rejected');
select tests.throws(
  $$insert into auth.users (email, raw_user_meta_data) values ('x3@example.com', '{"account_type":"provider","full_name":"مورد","city_id":"1","whatsapp":"12345","services":"خدمات"}')$$,
  '23514', 'provider with a bad WhatsApp number is rejected');
select tests.throws(
  $$insert into auth.users (email, raw_user_meta_data) values ('x4@example.com', '{"account_type":"provider","full_name":"مورد","city_id":"9999","whatsapp":"+966500000009","services":"خدمات"}')$$,
  '23503', 'provider with an unknown city is rejected');
select tests.throws(
  $$insert into auth.users (email, raw_user_meta_data) values ('x5@example.com', '{"account_type":"merchant","full_name":"م","phone":"+966500000001"}')$$,
  '23514', 'a one-letter name is rejected');
select tests.throws(
  $$insert into auth.users (email, raw_user_meta_data) values ('x6@example.com', '{"account_type":"merchant","full_name":"تاجر ثاني","phone":"+966500000001"}')$$,
  '23505', 'a phone number cannot be used by two accounts');

-- ---------------------------------------------------------------------------
-- Visitors (not signed in)
-- ---------------------------------------------------------------------------

set role anon;
select set_config('request.jwt.claims', '', false);

select tests.ok(tests.rows('select * from public.cities') = 20, 'visitor reads cities');
select tests.ok(tests.rows('select * from public.providers') = 2, 'visitor reads provider pages');
select tests.throws('select * from public.profiles', '42501', 'visitor cannot read private profiles');
select tests.throws('select * from public.audit_log', '42501', 'visitor cannot read the audit log');
select tests.throws(
  format('insert into public.listings (provider_id, title, description, city_id, category_id) values (%L, ''عنوان'', ''وصف طويل كفاية'', 1, 1)', :p1),
  '42501', 'visitor cannot create a listing');
select tests.throws($$select public.get_login_email_for_phone('+966500000001')$$, '42501', 'visitor cannot look up emails by phone');
select tests.throws($$select public.record_page_view('/')$$, '42501', 'visitor cannot write page views directly');

reset role;

-- ---------------------------------------------------------------------------
-- Merchant
-- ---------------------------------------------------------------------------

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:m1::text)), false);

select tests.ok(tests.rows('select * from public.profiles') = 1, 'merchant sees only their own profile');
select tests.throws(format('update public.profiles set role = ''admin'' where id = %L', :m1), '42501', 'merchant cannot make themselves admin');
select tests.throws(format('update public.profiles set status = ''active'' where id = %L', :m1), '42501', 'merchant cannot change their account status');

update public.profiles set full_name = 'مقهى الورد الجديد' where id = :m1;
select tests.ok((select full_name from public.profiles where id = :m1) = 'مقهى الورد الجديد', 'merchant edits their own name');

select tests.throws(
  format('insert into public.listings (provider_id, title, description, city_id, category_id) values (%L, ''عنوان'', ''وصف طويل كفاية'', 1, 1)', :m1),
  '42501', 'merchant cannot create a listing');
select tests.ok(tests.rows(format('update public.providers set services = ''اختراق'' where id = %L returning 1', :p1)) = 0, 'merchant cannot edit a provider page');

insert into public.reviews (provider_id, merchant_id, rating, comment) values (:p1, :m1, 4, 'تعامل ممتاز');
select tests.throws(
  format('insert into public.reviews (provider_id, merchant_id, rating) values (%L, %L, 5)', :p1, :m1),
  '23505', 'merchant cannot review the same provider twice');
select tests.throws(
  format('insert into public.reviews (provider_id, merchant_id, rating) values (%L, %L, 1)', :p2, :m2),
  '42501', 'merchant cannot review in someone else''s name');
select tests.throws(
  format('insert into public.reviews (provider_id, merchant_id, rating) values (%L, %L, 6)', :p2, :m1),
  '23514', 'rating above 5 is rejected');

select tests.ok(tests.rows('select * from public.audit_log') = 0 and tests.rows('select * from public.page_views_daily') = 0, 'merchant cannot read the audit log or visit counts');

insert into public.reports (reporter_id, target_type, target_id, reason) values (:m1, 'provider', :p2, 'إعلان مضلل');
select tests.throws(
  format('insert into public.reports (reporter_id, target_type, target_id, reason) values (%L, ''provider'', %L, ''مرة ثانية'')', :m1, :p2),
  '23505', 'merchant cannot repeat an open report on the same thing');

reset role;

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:m2::text)), false);
insert into public.reviews (provider_id, merchant_id, rating) values (:p1, :m2, 5);
select tests.ok(tests.rows(format('select * from public.reports where reporter_id = %L', :m1)) = 0, 'merchant cannot see other people''s reports');
select tests.ok(tests.rows(format('update public.reviews set rating = 1 where merchant_id = %L returning 1', :m1)) = 0, 'merchant cannot edit another merchant''s review');
reset role;

select tests.ok((select rating_avg from public.providers where id = :p1) = 4.50, 'provider rating average is updated (4 and 5 -> 4.50)');
select tests.ok((select rating_count from public.providers where id = :p1) = 2, 'provider rating count is updated');

-- ---------------------------------------------------------------------------
-- Provider
-- ---------------------------------------------------------------------------

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:p1::text)), false);

update public.providers set description = 'نوفر معدات القهوة المختصة' where id = :p1;
select tests.ok((select description from public.providers where id = :p1) = 'نوفر معدات القهوة المختصة', 'provider edits their own page');
select tests.throws(format('update public.providers set is_verified = true where id = %L', :p1), '42501', 'provider cannot verify themselves');
select tests.throws(format('update public.providers set rating_avg = 5 where id = %L', :p1), '42501', 'provider cannot change their rating');
select tests.throws(format('update public.providers set slug = ''my-page'' where id = %L', :p1), '42501', 'provider cannot change their page link');
select tests.ok(tests.rows(format('update public.providers set description = ''x'' where id = %L returning 1', :p2)) = 0, 'provider cannot edit another provider''s page');
select tests.throws(
  format('insert into public.reviews (provider_id, merchant_id, rating) values (%L, %L, 5)', :p2, :p1),
  '42501', 'provider cannot write reviews');

insert into public.provider_categories (provider_id, category_id) values (:p1, 1);
select tests.throws(format('insert into public.provider_categories (provider_id, category_id) values (%L, 1)', :p2), '42501', 'provider cannot set another provider''s categories');

insert into public.listings (provider_id, title, description, price, city_id, category_id)
values (:p1, 'مكينة إسبريسو', 'مكينة إسبريسو بحالة ممتازة', 12000, 1, 1);
select tests.ok(tests.rows('select * from public.listings') = 1, 'provider creates a listing');

-- Give the listing a known id so later tests can refer to it.
reset role;
update public.listings set id = 'aaaaaaaa-0000-0000-0000-000000000001' where provider_id = :p1;
set role authenticated;
select tests.throws(
  format('insert into public.listings (provider_id, title, description, city_id, category_id, status) values (%L, ''عنوان'', ''وصف طويل كفاية'', 1, 1, ''published'')', :p1),
  '42501', 'provider cannot set listing status');
select tests.throws(
  format('insert into public.listings (provider_id, title, description, city_id, category_id) values (%L, ''عنوان'', ''وصف طويل كفاية'', 1, 1)', :p2),
  '42501', 'provider cannot create a listing for another provider');
select tests.throws(
  $$update public.listings set provider_id = '44444444-4444-4444-4444-444444444444' where id = 'aaaaaaaa-0000-0000-0000-000000000001'$$,
  '42501', 'provider cannot move a listing to another provider');

insert into public.listing_images (listing_id, storage_key)
select 'aaaaaaaa-0000-0000-0000-000000000001', 'listings/aaaaaaaa-0000-0000-0000-000000000001/' || g || '.webp' from generate_series(1, 5) g;
select tests.throws(
  $$insert into public.listing_images (listing_id, storage_key) values ('aaaaaaaa-0000-0000-0000-000000000001', 'listings/aaaaaaaa-0000-0000-0000-000000000001/6.webp')$$,
  '23514', 'a listing cannot have more than 5 images');

reset role;

-- Free one image slot so the next test checks ownership, not the image limit.
delete from public.listing_images where storage_key = 'listings/aaaaaaaa-0000-0000-0000-000000000001/5.webp';

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:p2::text)), false);
select tests.throws(
  $$insert into public.listing_images (listing_id, storage_key) values ('aaaaaaaa-0000-0000-0000-000000000001', 'listings/aaaaaaaa-0000-0000-0000-000000000001/evil.webp')$$,
  '42501', 'provider cannot add images to another provider''s listing');
select tests.ok(tests.rows($$delete from public.listings where id = 'aaaaaaaa-0000-0000-0000-000000000001' returning 1$$) = 0, 'provider cannot delete another provider''s listing');
reset role;

-- ---------------------------------------------------------------------------
-- Hidden listings and suspended accounts
-- ---------------------------------------------------------------------------

update public.listings set status = 'hidden' where id = 'aaaaaaaa-0000-0000-0000-000000000001';

set role anon;
select set_config('request.jwt.claims', '', false);
select tests.ok(tests.rows('select * from public.listings') = 0, 'visitor does not see a hidden listing');
select tests.ok(tests.rows('select * from public.listing_images') = 0, 'visitor does not see a hidden listing''s images');
reset role;

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:p1::text)), false);
select tests.ok(tests.rows('select * from public.listings') = 1, 'provider still sees their own hidden listing');
select tests.throws($$update public.listings set status = 'published'$$, '42501', 'provider cannot unhide a listing');
reset role;

update public.listings set status = 'published' where id = 'aaaaaaaa-0000-0000-0000-000000000001';
update public.profiles set status = 'suspended' where id = :p1;

set role anon;
select set_config('request.jwt.claims', '', false);
select tests.ok(tests.rows('select * from public.providers') = 1, 'a suspended provider''s page is not public');
select tests.ok(tests.rows('select * from public.listings') = 0, 'a suspended provider''s listings are not public');
select tests.ok(tests.rows('select * from public.reviews') = 0, 'a suspended provider''s reviews are not public');
reset role;

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:p1::text)), false);
select tests.throws(
  format('insert into public.listings (provider_id, title, description, city_id, category_id) values (%L, ''عنوان'', ''وصف طويل كفاية'', 1, 1)', :p1),
  '42501', 'a suspended provider cannot create listings');
select tests.ok(tests.rows(format('update public.providers set description = ''x'' where id = %L returning 1', :p1)) = 0, 'a suspended provider cannot edit their page');
reset role;

update public.profiles set status = 'active' where id = :p1;

-- ---------------------------------------------------------------------------
-- Admin
-- ---------------------------------------------------------------------------

insert into public.audit_log (actor_id, action) values (:a1, 'test');

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:a1::text)), false);
select tests.ok(tests.rows('select * from public.profiles') = 5, 'admin sees all profiles');
select tests.ok(tests.rows('select * from public.reports') = 1, 'admin sees all reports');
select tests.ok(tests.rows('select * from public.audit_log') = 1, 'admin reads the audit log');
select tests.throws($$select public.get_login_email_for_phone('+966500000001')$$, '42501', 'even the admin cannot call server-only functions from the browser');
reset role;

-- ---------------------------------------------------------------------------
-- Server-only functions (service role)
-- ---------------------------------------------------------------------------

set role service_role;
select tests.ok(public.get_login_email_for_phone('+966500000001') = 'm1@example.com', 'server finds the login email for a phone');
select tests.ok(public.get_login_email_for_phone('+966599999999') is null, 'unknown phone returns nothing');
select public.record_page_view('/');
select public.record_page_view('/');
select tests.ok((select views from public.page_views_daily where path = '/') = 2, 'page views are counted');
reset role;

update public.profiles set status = 'suspended' where id = :m1;
set role service_role;
select tests.ok(public.get_login_email_for_phone('+966500000001') is null, 'a suspended account cannot log in by phone');
reset role;

-- ---------------------------------------------------------------------------
-- Guards: nothing is left open by mistake
-- ---------------------------------------------------------------------------

create table public.future_table (id int);

set role anon;
select tests.throws('select * from public.future_table', '42501', 'a new table is closed to visitors by default');
reset role;

set role authenticated;
select tests.throws('select * from public.future_table', '42501', 'a new table is closed to signed-in users by default');
reset role;

drop table public.future_table;

select tests.ok(
  not exists (
    select 1
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity
  ),
  'every table has row level security on');

-- Functions the browser may call. Anything else must not be callable.
select tests.ok(
  not exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and (has_function_privilege('anon', p.oid, 'execute')
           or has_function_privilege('authenticated', p.oid, 'execute'))
      and p.proname not in ('current_user_role', 'is_admin', 'is_account_active', 'set_provider_tags',
                             'normalize_search_text', 'search_pattern', 'search_listings', 'search_providers')
  ),
  'visitors and users can run only the allowed functions');
