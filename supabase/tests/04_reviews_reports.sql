-- Phase 4 tests: public reviews with reviewer names, editing reviews, reports.
-- Uses data from earlier files: p1 has reviews from m1 (4) and m2 (5); m1 is suspended.

\set m2 '''22222222-2222-2222-2222-222222222222'''
\set p1 '''33333333-3333-3333-3333-333333333333'''
\set p2 '''44444444-4444-4444-4444-444444444444'''
\set l1 '''aaaaaaaa-0000-0000-0000-000000000001'''

-- ---------------------------------------------------------------------------
-- Reading reviews
-- ---------------------------------------------------------------------------

set role anon;
select set_config('request.jwt.claims', '', false);
select tests.ok(tests.rows(format('select * from public.get_provider_reviews(%L)', :p1)) = 2, 'visitors read a provider''s reviews');
select tests.ok(
  (select bool_and(reviewer_name is not null) from public.get_provider_reviews(:p1)),
  'each review shows the reviewer''s name');
select tests.ok(
  (select bool_and(not is_mine) from public.get_provider_reviews(:p1)),
  'a visitor owns none of the reviews');
select tests.ok(tests.rows(format('select * from public.get_provider_reviews(%L, 1)', :p1)) = 1, 'reviews come in pages');
select tests.throws('select * from public.profiles', '42501', 'reviewer profiles stay private');
reset role;

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:m2::text)), false);
select tests.ok(
  (select is_mine from public.get_provider_reviews(:p1) limit 1),
  'a merchant''s own review comes first and is marked as theirs');

-- Edit own review: the average follows.
update public.reviews set rating = 3, comment = 'تغيرت الخدمة' where provider_id = :p1 and merchant_id = :m2;
reset role;
select tests.ok((select rating_avg from public.providers where id = :p1) = 3.50, 'editing a review updates the average (4 and 3 -> 3.50)');

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:m2::text)), false);
delete from public.reviews where provider_id = :p1 and merchant_id = :m2;
reset role;
select tests.ok((select rating_avg from public.providers where id = :p1) = 4.00, 'deleting a review updates the average');
select tests.ok((select rating_count from public.providers where id = :p1) = 1, 'deleting a review updates the count');

-- Suspended provider: no reviews shown.
update public.profiles set status = 'suspended' where id = :p1;
set role anon;
select tests.ok(tests.rows(format('select * from public.get_provider_reviews(%L)', :p1)) = 0, 'a suspended provider''s reviews are hidden');
reset role;
update public.profiles set status = 'active' where id = :p1;

-- ---------------------------------------------------------------------------
-- Reports
-- ---------------------------------------------------------------------------

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:m2::text)), false);
select tests.ok(tests.rows(format(
  'insert into public.reports (reporter_id, target_type, target_id, reason) values (%L, ''listing'', %L, ''سعر غير صحيح'') returning 1',
  :m2, :l1)) = 1, 'a merchant reports a listing');
select tests.throws(format(
  'insert into public.reports (reporter_id, target_type, target_id, reason) values (%L, ''listing'', gen_random_uuid(), ''غير موجود'')',
  :m2), '23503', 'a report on something that does not exist is rejected');
select tests.throws(format(
  'insert into public.reports (reporter_id, target_type, target_id, reason) values (%L, ''review'', %L, ''ليس تقييم'')',
  :m2, :l1), '23503', 'a report must match the type of what it points to');
reset role;

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s}', to_json(:p2::text)), false);
select tests.ok(tests.rows(format(
  'insert into public.reports (reporter_id, target_type, target_id, reason) values (%L, ''provider'', %L, ''انتحال اسم'') returning 1',
  :p2, :p1)) = 1, 'a provider can report another provider');
select tests.throws(
  format('update public.reports set status = ''resolved'' where reporter_id = %L', :p2),
  '42501', 'a reporter cannot close their own report');
reset role;

set role anon;
select set_config('request.jwt.claims', '', false);
select tests.throws(format(
  'insert into public.reports (reporter_id, target_type, target_id, reason) values (%L, ''provider'', %L, ''زائر'')',
  :m2, :p1), '42501', 'visitors cannot report');
reset role;
