-- SAMPLE DATA FOR LOCAL DEVELOPMENT AND END-TO-END TESTS ONLY.
-- The Supabase CLI loads this file on `supabase start` / `supabase db reset` on your
-- own machine or in CI. Never run it on the live project: the businesses, numbers and
-- reviews are made up, and the accounts have a known password.
--
-- Every account's password: Sample-pass-1
--   provider1@example.com, provider2@example.com, provider3@example.com (providers)
--   merchant1@example.com, merchant2@example.com (merchants)
--   admin@example.com (admin; the authenticator app is set up on first visit to /admin)

do $$
declare
  u record;
begin
  for u in
    select *
    from (values
      ('a1000000-0000-4000-8000-000000000001'::uuid, 'provider1@example.com',
       '{"account_type":"provider","full_name":"مؤسسة البن للمعدات (تجريبي)","city_id":"1","whatsapp":"+966500000001","services":"مكائن إسبريسو، مطاحن، صيانة مكائن القهوة"}'::jsonb),
      ('b2000000-0000-4000-8000-000000000002', 'provider2@example.com',
       '{"account_type":"provider","full_name":"شركة الأثاث الحديث (تجريبي)","city_id":"2","whatsapp":"+966500000002","services":"طاولات وكراسي للمطاعم والمقاهي، تفصيل حسب الطلب"}'),
      ('c3000000-0000-4000-8000-000000000003', 'provider3@example.com',
       '{"account_type":"provider","full_name":"تغليف بلس (تجريبي)","city_id":"1","whatsapp":"+966500000003","services":"أكياس وعلب مطبوعة بشعارك للمتاجر الإلكترونية"}'),
      ('d4000000-0000-4000-8000-000000000001', 'merchant1@example.com',
       '{"account_type":"merchant","full_name":"مقهى الورد (تجريبي)"}'),
      ('e5000000-0000-4000-8000-000000000002', 'merchant2@example.com',
       '{"account_type":"merchant","full_name":"مطعم السفرة (تجريبي)"}'),
      ('90000000-0000-4000-8000-000000000001', 'admin@example.com',
       '{"account_type":"merchant","full_name":"مدير تجريبي"}')
    ) as t (id, email, meta)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_new, email_change,
      email_change_token_current, phone_change, phone_change_token, reauthentication_token
    ) values (
      '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
      extensions.crypt('Sample-pass-1', extensions.gen_salt('bf')), now(),
      '{"provider":"email","providers":["email"]}', u.meta, now(), now(),
      '', '', '', '', '', '', '', ''
    );
    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    ) values (
      u.id::text, u.id,
      jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
      'email', now(), now(), now()
    );
  end loop;
end
$$;

update public.profiles set role = 'admin' where id = '90000000-0000-4000-8000-000000000001';

update public.providers
set is_verified = true,
    description = 'خبرة 10 سنوات في تجهيز المقاهي المختصة. نوفر الضمان والصيانة. (بيانات تجريبية)'
where id = 'a1000000-0000-4000-8000-000000000001';

insert into public.provider_sectors (provider_id, sector_id) values
  ('a1000000-0000-4000-8000-000000000001', 2),
  ('b2000000-0000-4000-8000-000000000002', 1),
  ('b2000000-0000-4000-8000-000000000002', 2),
  ('c3000000-0000-4000-8000-000000000003', 3);

insert into public.provider_categories (provider_id, category_id) values
  ('a1000000-0000-4000-8000-000000000001', 1),
  ('a1000000-0000-4000-8000-000000000001', 7),
  ('b2000000-0000-4000-8000-000000000002', 2),
  ('c3000000-0000-4000-8000-000000000003', 3);

insert into public.reviews (provider_id, merchant_id, rating, comment) values
  ('a1000000-0000-4000-8000-000000000001', 'd4000000-0000-4000-8000-000000000001', 5, 'تعامل ممتاز وتوصيل سريع.'),
  ('a1000000-0000-4000-8000-000000000001', 'e5000000-0000-4000-8000-000000000002', 4, null),
  ('b2000000-0000-4000-8000-000000000002', 'd4000000-0000-4000-8000-000000000001', 4, null);

insert into public.listings
  (id, provider_id, title, description, price, city_id, category_id, contact_method, created_at)
values
  ('30000000-0000-4000-8000-000000000001', 'a1000000-0000-4000-8000-000000000001',
   'مكينة إسبريسو مجموعتين', 'مكينة إسبريسو إيطالية بمجموعتين، بحالة ممتازة مع ضمان سنة.',
   14500, 1, 1, 'whatsapp', now() - interval '2 hours'),
  ('30000000-0000-4000-8000-000000000002', 'a1000000-0000-4000-8000-000000000001',
   'مطحنة قهوة احترافية', 'مطحنة حبوب للمقاهي، شفرات 64 ملم، توريد خلال أسبوع.',
   3200, 1, 1, 'whatsapp', now() - interval '1 day'),
  ('30000000-0000-4000-8000-000000000003', 'b2000000-0000-4000-8000-000000000002',
   'طاولات خشب للمقاهي', 'طاولات خشب طبيعي بمقاسات مختلفة، تفصيل حسب المساحة.',
   850, 2, 2, 'call', now() - interval '3 days'),
  ('30000000-0000-4000-8000-000000000004', 'c3000000-0000-4000-8000-000000000003',
   'علب كرتون مطبوعة بشعارك', 'علب شحن بطباعة شعارك، أقل كمية 500 علبة. السعر حسب الكمية.',
   null, 1, 3, 'whatsapp', now() - interval '5 days');
