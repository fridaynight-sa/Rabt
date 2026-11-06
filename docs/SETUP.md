# التجهيز والإطلاق

هذي الخطوات تسويها أنت مرة وحدة. كل الحسابات تكون بإيميلك.

## 1. Supabase (قاعدة البيانات وتسجيل الدخول)

1. سوّ حساب في supabase.com، وبعدها مشروع جديد. اختر المنطقة الأقرب (مثلاً Frankfurt أو Mumbai).
2. احفظ كلمة مرور قاعدة البيانات في Bitwarden.
3. من **SQL Editor** شغّل ملفات `supabase/migrations` بالترتيب (أو أنا أسويها بالأداة لما تعطيني الصلاحية).
4. من **Authentication > URL Configuration**:
   - Site URL: `https://rabt.faisal2013ksaksa.workers.dev`
   - Redirect URLs: أضف `https://rabt.faisal2013ksaksa.workers.dev/auth/confirm`
5. من **Authentication > Email Templates**: انسخ محتوى `supabase/templates/confirmation.html` لقالب Confirm signup، و`recovery.html` لقالب Reset password، و`email_change.html` لقالب Change email address. وتأكد إن خيار **Secure email change** مفعّل.
6. من **Project Settings > API Keys**: انسخ الـ URL والـ Publishable key والـ Secret key وحطها في Bitwarden.
7. من **Authentication > Attack Protection**: فعّل **Captcha** واختر Cloudflare Turnstile، وحط الـ Secret key اللي تاخذه من Cloudflare (الخطوة 2 تحت).
8. من **Authentication > Rate Limits**: ارفع حد تسجيل الدخول والتسجيل (مثلاً 300 بالساعة)، لأن طلبات كل الزوار تمر من سيرفر الموقع.

### الصور (Supabase Storage)

مخزن الصور `rabt-media` وقواعد الوصول له تنسوى تلقائياً لما تنشغل ملفات `supabase/migrations`. ما تحتاج تسوي شي يدوي.

**حدود الباقة المجانية:**

- **التخزين:** 1 جيجا. كل صورة تنضغط قبل الرفع لحوالي 100 إلى 250 كيلو، يعني تقريباً 4000 إلى 8000 صورة.
- **التحميل:** 5 جيجا بالشهر، تقريباً 25 ألف مشاهدة صورة بالشهر. والمتصفح يحفظ الصورة بعد أول مرة، فالزائر اللي يرجع ما يحمّلها من جديد.
- تابع الاستهلاك من **Supabase > Usage**. إذا قربت من الحد: ترقّى لـ Supabase Pro، أو انقل الصور لـ Cloudflare R2. النقل جاهز في الكود بخطوات قليلة، وهي مكتوبة في `docs/ARCHITECTURE.md`.

## 2. Cloudflare (الاستضافة)

1. سوّ حساب في cloudflare.com.
2. من **Workers & Pages** اربط مستودع GitHub.
3. أضف المتغيرات:
   - وقت البناء: `NEXT_PUBLIC_SUPABASE_URL` و`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` و`NEXT_PUBLIC_SITE_URL` (`https://rabt.faisal2013ksaksa.workers.dev`) و`NEXT_PUBLIC_TURNSTILE_SITE_KEY` و`NEXT_PUBLIC_CONTACT_EMAIL` (إيميل التواصل اللي يظهر في صفحتي الشروط والخصوصية)
   - سر (Secret): `SUPABASE_SECRET_KEY`
   - **Turnstile:** من قائمة **Turnstile** سوّ موقع جديد بنفس رابط الموقع. يعطيك Site key (يروح في `NEXT_PUBLIC_TURNSTILE_SITE_KEY`) وSecret key (يروح في Supabase، الخطوة 7 فوق).
4. أمر البناء: `npx opennextjs-cloudflare build`، وأمر النشر: `npx opennextjs-cloudflare deploy`.

## 3. حساب الأدمن

1. سجّل في الموقع كتاجر عادي بإيميلك وأكّده.
2. في Supabase SQL Editor شغّل الأمر الموجود في `docs/SECURITY.md` (قسم Making the first admin).
3. سجّل خروج ودخول، وافتح `/admin`.
4. أول مرة يطلب منك تفعيل التحقق بخطوتين: نزّل تطبيق Google Authenticator أو Microsoft Authenticator وامسح الرمز. بعدها كل دخول للوحة الإدارة يطلب الرمز من التطبيق.

## 4. المراقبة

- **UptimeRobot (مجاني):** أضف مراقبة نوعها HTTP(s) على `https://<رابط الموقع>/api/health` كل 5 دقائق. يوصلك إيميل لو الموقع أو قاعدة البيانات طاحت.
- **الأخطاء:** تنحفظ في Cloudflare، من **Workers & Pages > rabt > Logs**.

## 5. النسخ الاحتياطي الأسبوعي

يشتغل تلقائياً كل جمعة الساعة 3 الفجر، وينحفظ مشفّر في GitHub لمدة 90 يوم.

1. في GitHub افتح المستودع، ثم **Settings > Secrets and variables > Actions**، وأضف:
   - `SUPABASE_DB_URL`: من Supabase، **Connect > Session pooler** (الرابط كامل مع كلمة مرور قاعدة البيانات).
   - `BACKUP_PASSPHRASE`: كلمة سر طويلة تختارها، واحفظها في Bitwarden. بدونها ما تقدر تفتح النسخة.
2. للتجربة: **Actions > Weekly database backup > Run workflow**.

ملاحظة: النسخة الاحتياطية تشمل قاعدة البيانات بس. ملفات الصور تبقى في Supabase Storage.

## 6. قبل الإطلاق

- [ ] كل الخطوات فوق
- [ ] تجربة كاملة على الموقع الحقيقي: تسجيل تاجر ومورد، تأكيد الإيميل، إضافة صور وإعلان، تقييم، بلاغ، لوحة الإدارة
- [ ] مراجعة صفحتي الشروط والخصوصية (يفضّل من محامي)
- [ ] تفعيل UptimeRobot والنسخ الاحتياطي
