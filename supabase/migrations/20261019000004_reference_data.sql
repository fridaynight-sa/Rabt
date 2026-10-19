-- Rabt: starting reference data. Admins can manage these later.

insert into public.cities (slug, name_ar, sort_order) values
  ('riyadh', 'الرياض', 1),
  ('jeddah', 'جدة', 2),
  ('makkah', 'مكة المكرمة', 3),
  ('madinah', 'المدينة المنورة', 4),
  ('dammam', 'الدمام', 5),
  ('khobar', 'الخبر', 6),
  ('dhahran', 'الظهران', 7),
  ('qassim', 'القصيم', 8),
  ('abha', 'أبها', 9),
  ('khamis-mushait', 'خميس مشيط', 10),
  ('taif', 'الطائف', 11),
  ('tabuk', 'تبوك', 12),
  ('hail', 'حائل', 13),
  ('jazan', 'جازان', 14),
  ('najran', 'نجران', 15),
  ('al-ahsa', 'الأحساء', 16),
  ('jubail', 'الجبيل', 17),
  ('yanbu', 'ينبع', 18),
  ('al-baha', 'الباحة', 19),
  ('al-jouf', 'الجوف', 20);

insert into public.sectors (slug, name_ar, sort_order) values
  ('restaurants', 'المطاعم', 1),
  ('cafes', 'الكوفيهات', 2),
  ('online-stores', 'المتاجر الإلكترونية', 3);

insert into public.categories (slug, name_ar, sort_order) values
  ('equipment', 'معدات', 1),
  ('furniture', 'أثاث', 2),
  ('packaging', 'تغليف', 3),
  ('raw-materials', 'مواد غذائية وخامات', 4),
  ('branding', 'تصميم وهوية', 5),
  ('marketing', 'تسويق', 6),
  ('maintenance', 'صيانة', 7),
  ('pos-tech', 'أنظمة نقاط البيع والتقنية', 8),
  ('logistics', 'توصيل وشحن', 9),
  ('interior', 'ديكور وتشطيبات', 10),
  ('photography', 'تصوير', 11),
  ('other', 'أخرى', 99);
