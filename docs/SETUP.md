# التجهيز والإطلاق

هذي الخطوات تسويها أنت مرة وحدة. كل الحسابات تكون بإيميلك.

## 1. Supabase (قاعدة البيانات وتسجيل الدخول)

1. سوّ حساب في supabase.com، وبعدها مشروع جديد. اختر المنطقة الأقرب (مثلاً Frankfurt أو Mumbai).
2. احفظ كلمة مرور قاعدة البيانات في Bitwarden.
3. من **SQL Editor** شغّل ملفات `supabase/migrations` بالترتيب (أو أنا أسويها بالأداة لما تعطيني الصلاحية).
4. من **Authentication > URL Configuration**:
   - Site URL: رابط الموقع (مثلاً `https://rabt.pages.dev`)
   - Redirect URLs: أضف `https://<رابط الموقع>/auth/confirm`
5. من **Authentication > Email Templates**: انسخ محتوى `supabase/templates/confirmation.html` لقالب Confirm signup، و`recovery.html` لقالب Reset password، و`email_change.html` لقالب Change email address. وتأكد إن خيار **Secure email change** مفعّل.
6. من **Project Settings > API Keys**: انسخ الـ URL والـ Publishable key والـ Secret key وحطها في Bitwarden.

## 2. Cloudflare (الاستضافة)

1. سوّ حساب في cloudflare.com.
2. من **Workers & Pages** اربط مستودع GitHub.
3. أضف المتغيرات:
   - وقت البناء: `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` و`NEXT_PUBLIC_SITE_URL`
   - سر (Secret): `SUPABASE_SECRET_KEY`
4. من **R2** سوّ مخزن (bucket) اسمه `rabt-media`. هذا مكان صور الموردين والإعلانات، ويكون خاص (مو عام).
5. أمر البناء: `npx opennextjs-cloudflare build`، وأمر النشر: `npx opennextjs-cloudflare deploy`.

## 3. حساب الأدمن

1. سجّل في الموقع كتاجر عادي بإيميلك وأكّده.
2. في Supabase SQL Editor شغّل الأمر الموجود في `docs/SECURITY.md` (قسم Making the first admin).
3. سجّل خروج ودخول، وافتح `/admin`.
4. أول مرة يطلب منك تفعيل التحقق بخطوتين: نزّل تطبيق Google Authenticator أو Microsoft Authenticator وامسح الرمز. بعدها كل دخول للوحة الإدارة يطلب الرمز من التطبيق.

## 4. المراقبة

- UptimeRobot: أضف رابط الموقع، ويوصلك تنبيه لو طاح.
