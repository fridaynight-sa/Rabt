-- Phase 5 tests: admin functions, the second login step, and the audit log.
-- From earlier files: a1 is admin; m1 suspended merchant; m2 merchant; p1, p2 providers;
-- listing l1 belongs to p1; reports exist from 04.

\set m1 '''11111111-1111-1111-1111-111111111111'''
\set m2 '''22222222-2222-2222-2222-222222222222'''
\set p1 '''33333333-3333-3333-3333-333333333333'''
\set p2 '''44444444-4444-4444-4444-444444444444'''
\set a1 '''55555555-5555-5555-5555-555555555555'''
\set l1 '''aaaaaaaa-0000-0000-0000-000000000001'''

delete from public.audit_log;

-- ---------------------------------------------------------------------------
-- Not admin: every admin function refuses
-- ---------------------------------------------------------------------------

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s,"aal":"aal2"}', to_json(:m2::text)), false);
select tests.throws('select * from public.admin_list_accounts()', '42501', 'a merchant cannot list accounts');
select tests.throws(format('select public.admin_set_account_status(%L, ''suspended'')', :p1), '42501', 'a merchant cannot suspend accounts');
select tests.throws(format('select public.admin_set_listing_status(%L, ''hidden'')', :l1), '42501', 'a merchant cannot hide listings');
select tests.throws('select public.admin_stats()', '42501', 'a merchant cannot read admin stats');
select tests.throws($$select public.admin_log('account.delete', 'account', 'x')$$, '42501', 'a merchant cannot write the audit log');
select tests.throws($$select public.write_audit('x', 'y', 'z')$$, '42501', 'nobody calls the audit helper directly');
reset role;

-- Admin without the second login step: refused too.
set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s,"aal":"aal1"}', to_json(:a1::text)), false);
select tests.throws('select * from public.admin_list_accounts()', '42501', 'an admin without the second login step cannot list accounts');
select tests.throws(format('select public.admin_set_listing_status(%L, ''hidden'')', :l1), '42501', 'an admin without the second login step cannot hide listings');
reset role;

set role anon;
select set_config('request.jwt.claims', '', false);
select tests.throws('select public.admin_stats()', '42501', 'visitors cannot call admin functions');
reset role;

-- ---------------------------------------------------------------------------
-- Admin with the second login step
-- ---------------------------------------------------------------------------

set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s,"aal":"aal2"}', to_json(:a1::text)), false);

select tests.ok(tests.rows('select * from public.admin_list_accounts()') = 5, 'admin lists all accounts');
select tests.ok(
  (select email from public.admin_list_accounts(p_query => 'm2@example')) = 'm2@example.com',
  'admin finds an account by email');
select tests.ok(tests.rows($$select * from public.admin_list_accounts(p_role => 'provider')$$) = 2, 'admin filters accounts by role');
select tests.ok(tests.rows($$select * from public.admin_list_accounts(p_status => 'suspended')$$) = 1, 'admin filters accounts by status');

select public.admin_set_account_status(:p2, 'suspended');
select tests.ok((select status from public.profiles where id = :p2) = 'suspended', 'admin suspends an account');
select public.admin_set_account_status(:p2, 'active');
select tests.throws(format('select public.admin_set_account_status(%L, ''suspended'')', :a1), '42501', 'admin cannot suspend themselves');

select public.admin_set_provider_verified(:p1, true);
select tests.ok((select is_verified from public.providers where id = :p1), 'admin verifies a provider');

select public.admin_set_listing_status(:l1, 'hidden');
select tests.ok((select status from public.listings where id = :l1) = 'hidden', 'admin hides a listing');
select public.admin_set_listing_status(:l1, 'published');

select tests.ok(tests.rows('select * from public.admin_list_reports()') >= 1, 'admin lists open reports');
select tests.ok(
  (select bool_and(target_path is not null and target_label is not null) from public.admin_list_reports()),
  'each report links to what it points at');
select public.admin_resolve_report((select id from public.admin_list_reports() limit 1), 'resolved');
select tests.throws(
  format('select public.admin_resolve_report(%L, ''resolved'')', (select id from public.reports where status = 'resolved' limit 1)),
  'P0002', 'a closed report cannot be closed again');

select public.admin_delete_review((select id from public.reviews limit 1));
select tests.ok((select count(*) from public.reviews) = 0, 'admin deletes a review');

select tests.ok(public.admin_save_reference('categories', null, 'coffee-beans', 'حبوب القهوة', 50::smallint) > 0, 'admin adds a category');
select public.admin_save_reference('categories', (select id from public.categories where slug = 'coffee-beans'), 'coffee-beans', 'بن مختص', 50::smallint);
select tests.ok((select name_ar from public.categories where slug = 'coffee-beans') = 'بن مختص', 'admin renames a category');
select tests.throws($$select public.admin_save_reference('profiles', null, 'x', 'x')$$, '22023', 'admin can only edit the reference lists');

select public.admin_log('account.delete', 'account', :m1, '{"email":"m1@example.com"}');
select tests.throws($$select public.admin_log('drop.everything', 'x', 'y')$$, '22023', 'the audit log only takes known outside actions');

select tests.ok((public.admin_stats() ->> 'providers')::int = 2, 'admin stats count providers');
select tests.ok(jsonb_array_length(public.admin_stats(7) -> 'views_by_day') = 7, 'admin stats give one row per day');
select tests.ok(
  (public.admin_stats(7) -> 'views_by_day' -> 0 ->> 'day') ~ '^\d{4}-\d{2}-\d{2}$',
  'each day in the stats is a plain date');
reset role;

-- ---------------------------------------------------------------------------
-- The audit log recorded every change, with who did it
-- ---------------------------------------------------------------------------

select tests.ok(
  (select array_agg(action order by id) from public.audit_log)::text
  = '{account.suspend,account.activate,provider.verify,listing.hide,listing.show,report.resolved,review.delete,reference.add,reference.rename,account.delete}',
  'every admin change is in the audit log, in order');
select tests.ok((select bool_and(actor_id = :a1) from public.audit_log), 'the audit log records which admin did it');
select tests.ok(
  (select details ->> 'comment' from public.audit_log where action = 'review.delete') is not null
  or (select details ? 'rating' from public.audit_log where action = 'review.delete'),
  'a deleted review is kept in the audit log');

-- Nobody can edit or delete the audit log, not even the admin.
set role authenticated;
select set_config('request.jwt.claims', format('{"sub":%s,"aal":"aal2"}', to_json(:a1::text)), false);
select tests.throws('delete from public.audit_log', '42501', 'even the admin cannot delete the audit log');
select tests.throws($$update public.audit_log set action = 'x'$$, '42501', 'even the admin cannot change the audit log');
reset role;
