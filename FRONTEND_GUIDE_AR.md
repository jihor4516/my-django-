# دليل الـ Frontend بالعربية

## 1. نظرة عامة

الواجهة الأمامية مبنية بـ Next.js 14 باستخدام App Router.

وظيفتها الأساسية هي:

- عرض الموقع العام والواجهة التسويقية.
- تصفح المعدات والبحث والتصفية.
- تسجيل الدخول والتسجيل.
- تمكين العميل من إرسال طلبات الإيجار.
- توفير لوحة عميل ولوحة موظف.
- استهلاك واجهات Django API والتعامل مع النتائج.

المجلد الأساسي للواجهة هو:

`frontend/`

## 2. كيف يتحرك الطلب داخل الـ frontend

1. يدخل المستخدم إلى صفحة من `app/`.
2. الصفحة إما:
   - تجلب بيانات مباشرة من الـ backend عبر `lib/api.js` إذا كانت Server Component.
   - أو تستخدم `lib/client-api.js` إذا كانت Client Component وتحتاج جلسة المستخدم أو تفاعلًا مباشرًا.
3. النصوص تترجم عبر `components/i18n/language-provider.js` وملفات `locales/*.json`.
4. الصور والملفات القادمة من Django يتم تحويل روابطها عبر `lib/backend-url.js`.

## 3. الملفات الجذرية في frontend

### `frontend/package.json`
- يعرف حزم المشروع وأوامر التشغيل:
  - `dev`
  - `build`
  - `start`
  - `lint`
  - `i18n:scan`

### `frontend/package-lock.json`
- يثبت نسخ الحزم بدقة لضمان نفس البيئة عند التثبيت.

### `frontend/next.config.mjs`
- إعدادات Next.js العامة.

### `frontend/jsconfig.json`
- يضبط Aliases مثل `@/` لتسهيل الاستيراد بدل المسارات الطويلة.

### `frontend/.env.local.example`
- مثال لمتغيرات البيئة الخاصة بالواجهة الأمامية.

### `frontend/globals.css`
- غير موجود في الجذر مباشرة، بل الملف الفعلي في `app/globals.css`.

## 4. مجلد `frontend/app/`

هذا هو قلب App Router في Next.js. كل مجلد هنا يمثل مسارًا للموقع.

### `frontend/app/layout.js`
- الـ Root Layout للتطبيق كله.
- يطبق:
  - `globals.css`
  - `SiteHeader`
  - `SiteFooter`
  - `LanguageProvider`
- يقرأ اللغة من Cookie ويحدد اتجاه الصفحة RTL أو LTR.

### `frontend/app/globals.css`
- الملف المركزي لكل الأنماط العامة.
- يحتوي تنسيقات:
  - الرأس والتنقل
  - البطاقات
  - النماذج
  - الشبكات
  - تجاوب الهاتف واللوحات والحاسوب

### `frontend/app/page.js`
- الصفحة الرئيسية.
- يجلب الفئات والمعدات المميزة من الـ backend.
- يركّب مكونات الواجهة الرئيسية مثل Hero والخدمات والفئات والمنتجات والخطوات.

### `frontend/app/services/page.js`
- صفحة الخدمات.
- تبني محتواها من قاموس الترجمة الحالي.
- تعرض الخدمات، نبذة المؤسسة، خطوات العمل، وCTA.

### `frontend/app/catalogue/page.js`
- صفحة الكتالوج الرئيسية.
- تعرض الفلاتر والنتائج والتصفح بين الصفحات.
- تعتمد على `getItems` و `getCategories`.

### `frontend/app/cataloge/page.js`
- مسار قديم أو كتابة بديلة لكلمة catalogue.
- يقوم فقط بإعادة التوجيه إلى `/catalogue`.
- فائدته الحفاظ على التوافق مع روابط قديمة أو أخطاء إملائية سابقة.

### `frontend/app/items/[id]/page.js`
- صفحة تفاصيل منتج واحد.
- تعرض الصور والحالة والوصف والمواصفات.
- تتيح إرسال طلب إيجار من نفس الصفحة.
- تحمل أيضًا منتجات مشابهة من نفس التصنيف.

### `frontend/app/login/page.js`
- صفحة تسجيل الدخول.
- تعرض `LoginForm` داخل `Suspense`.

### `frontend/app/signup/page.js`
- صفحة إنشاء حساب جديد.
- تعرض `SignupForm`.

### `frontend/app/tenant-dashboard/page.js`
- لوحة العميل.
- تعرض:
  - مؤشرات KPI
  - الإشعارات
  - الطلبات الأخيرة
  - العقود وروابط التنزيل والطباعة

### `frontend/app/account/page.js`
- صفحة الحساب الشخصي للعميل.
- تجمع بين:
  - تعديل معلومات الحساب
  - عرض الملفات المرتبطة بالمستأجر
  - الإشعارات
  - العقود والإحصائيات

### `frontend/app/admin/page.js`
- صفحة إدارة الموظفين الرئيسية.
- تعرض `StaffDashboardPage`.

### `frontend/app/admin/documents/page.js`
- صفحة مستندات الموظفين.
- تعرض `DocumentsPage`.

### `frontend/app/documents/page.js`
- مسار قديم يعيد التوجيه إلى `/admin/documents`.

### `frontend/app/staff-dashboard/page.js`
- مسار قديم يعيد التوجيه إلى `/admin`.

## 5. مجلد `frontend/components/`

هذا المجلد يحتوي القطع القابلة لإعادة الاستخدام.

### 5.1 `components/layout/`

#### `frontend/components/layout/site-header.js`
- مكون الهيدر الرئيسي.
- مسؤول عن:
  - الشعار
  - روابط التنقل
  - تبديل اللغة
  - معرفة حالة المستخدم الحالي
  - إظهار روابط مناسبة للعميل أو الموظف
  - القائمة المتجاوبة في الهاتف

#### `frontend/components/layout/site-footer.js`
- مكون الفوتر العام للموقع.

### 5.2 `components/auth/`

#### `frontend/components/auth/login-form.js`
- نموذج تسجيل الدخول.
- يستخدم `loginUser` من `client-api.js`.
- بعد النجاح يوجه المستخدم حسب دوره:
  - موظف إلى `/admin`
  - عميل إلى `/tenant-dashboard`

#### `frontend/components/auth/signup-form.js`
- نموذج التسجيل الكامل.
- يجمع بيانات الفرد أو الشركة أو الجمعية.
- يرسل البيانات إلى API.
- يتعامل مع خطوة التحقق بالكود.
- يحتوي الآن حقل `address` ضمن النموذج لأنه مطلوب من الـ backend.

### 5.3 `components/admin/`

#### `frontend/components/admin/staff-dashboard-page.js`
- أكبر مكون إداري في المشروع.
- يمثل مساحة العمل الداخلية للموظف.
- يضم تبويبات لإدارة:
  - نظرة عامة
  - طلبات الإيجار
  - الإشعارات
  - المخزون
  - إضافة أو تعديل المعدات
- يتعامل مع إنشاء تصنيفات، إنشاء معدات، رفع الصور، إرسال الإشعارات، والموافقة على الطلبات.

#### `frontend/components/admin/documents-page.js`
- شاشة إنشاء الوثائق الإدارية للموظفين.
- تتيح اختيار العميل ونوع الوثيقة والمعدات والكميات.
- تعرض أيضًا قائمة آخر المستندات مع روابط المعاينة والطباعة وPDF.

### 5.4 `components/dashboard/`

#### `frontend/components/dashboard/kpi-grid.js`
- شبكة عرض المؤشرات المختصرة مثل عدد الطلبات والعقود والإشعارات.

#### `frontend/components/dashboard/request-list.js`
- مكون مساعد لعرض الطلبات على شكل قائمة إن كان مستخدمًا في صفحات أخرى.

### 5.5 `components/home/`

#### `frontend/components/home/hero-banner.js`
- القسم الافتتاحي في الصفحة الرئيسية.

#### `frontend/components/home/service-highlights.js`
- عرض مختصر للخدمات الأساسية.

#### `frontend/components/home/category-grid.js`
- شبكة الفئات القادمة من الـ backend.

#### `frontend/components/home/featured-products.js`
- عرض معدات مختارة أو بارزة.

#### `frontend/components/home/process-timeline.js`
- يشرح خطوات العمل أو التأجير على شكل تسلسل.

#### `frontend/components/home/cta-panel.js`
- لوحة دعوة لاتخاذ إجراء مثل التسجيل أو فتح الكتالوج.

### 5.6 `components/i18n/`

#### `frontend/components/i18n/language-provider.js`
- مزود اللغة والترجمة داخل React.
- يتيح `t()` و`lang` و`setLang()` لباقي المكونات.

### 5.7 `components/ui/`

#### `frontend/components/ui/empty-state.js`
- يعرض واجهة فارغة عندما لا توجد بيانات.

#### `frontend/components/ui/status-badge.js`
- يعرض شارة حالة ملونة مثل `approved`, `pending`, `available`.

#### `frontend/components/ui/notifications-panel.js`
- يعرض قائمة الإشعارات مع أزرار فتح أو تعليم كمقروء.

## 6. مجلد `frontend/lib/`

هذا المجلد هو الطبقة الخدمية المشتركة في الواجهة.

### `frontend/lib/backend-url.js`
- يحوّل روابط Django إلى روابط صحيحة يمكن فتحها من المتصفح.
- مهم جدًا للصور وملفات PDF وروابط المعاينة.
- يعالج الفرق بين `localhost` و`127.0.0.1` أيضًا.

### `frontend/lib/api.js`
- طبقة fetch بسيطة لصفحات السيرفر Server Components.
- تستخدم لجلب البيانات العامة مثل الأصناف والمعدات.
- تضيف timeout وإعادة استخدام cache الخاصة بـ Next.js.

### `frontend/lib/client-api.js`
- طبقة API لصفحات Client Components.
- تضيف `credentials: 'include'` حتى تعمل جلسات Django.
- تحتوي دوال الجلسة والتفاعل مثل:
  - تسجيل الدخول والخروج
  - التسجيل والتحقق
  - لوحة العميل
  - لوحة الموظف
  - الإشعارات
  - المستندات
  - إدارة المخزون

### `frontend/lib/format.js`
- دوال تنسيق مساعدة مثل تنسيق التاريخ والمبالغ والنصوص المختصرة.

### `frontend/lib/i18n.js`
- تعريف اللغات المدعومة.
- تحميل القواميس من JSON.
- توحيد اللغة وتحديد هل الاتجاه RTL أو LTR.

## 7. مجلد `frontend/data/`

### `frontend/data/site.js`
- يحتوي بيانات ثابتة أو خيارات مشتركة للواجهة مثل أنواع المستندات وبعض القيم المرجعية.

## 8. مجلد `frontend/locales/`

### `frontend/locales/ar.json`
- النصوص العربية.

### `frontend/locales/fr.json`
- النصوص الفرنسية.

### `frontend/locales/en.json`
- النصوص الإنجليزية.

هذه الملفات هي المصدر الرئيسي لترجمة نصوص الواجهة الحديثة.

## 9. مسارات العمل الأساسية في الـ frontend

### تسجيل الدخول
1. المستخدم يفتح `/login`.
2. `login-form.js` يجمع الاسم وكلمة المرور.
3. يرسلها إلى `loginUser()` داخل `client-api.js`.
4. عند النجاح يتم تحويله إلى لوحة العميل أو الإدارة حسب الدور.

### إنشاء حساب
1. المستخدم يفتح `/signup`.
2. `signup-form.js` يجمّع البيانات حسب نوع المستخدم.
3. يرسل البيانات إلى `signupUser()`.
4. بعد نجاح التسجيل ينتقل إلى خطوة إدخال كود التحقق.

### تصفح الكتالوج
1. المستخدم يزور `/catalogue`.
2. الصفحة تجلب الفئات والمعدات من Django.
3. يتم عرض الفلاتر والنتائج والصور والحالات.
4. الضغط على أي عنصر يذهب إلى `/items/[id]`.

### إرسال طلب إيجار
1. المستخدم يفتح صفحة عنصر محدد.
2. يملأ الكمية وبيانات الحدث والتاريخ.
3. الصفحة تستدعي `createRentalRequest()`.
4. بعد النجاح يتم توجيهه نحو لوحة العميل.

### لوحة العميل
1. `tenant-dashboard/page.js` يطلب بيانات اللوحة حسب اللغة الحالية.
2. يعرض الطلبات والعقود والإشعارات.
3. يمكن تنزيل العقد أو طباعته من الروابط القادمة من الـ backend.

### لوحة الموظف
1. `admin/page.js` يعرض `staff-dashboard-page.js`.
2. المكون يجلب البيانات الإدارية كلها دفعة واحدة.
3. الموظف يمكنه:
   - الموافقة أو الرفض
   - إنشاء عنصر جديد
   - إنشاء تصنيف جديد
   - رفع صورة للمعدة
   - إرسال إشعار

### المستندات الإدارية
1. الموظف يفتح `/admin/documents`.
2. يختار نوع الوثيقة والعميل والعناصر.
3. `DocumentsPage` يرسل البيانات إلى backend.
4. بعد الإنشاء تظهر الروابط الجاهزة للمعاينة والطباعة وPDF.

## 10. ملاحظات معمارية مهمة

### المشروع يستخدم نمطين من الجلب
- `lib/api.js` للطلبات العامة من Server Components.
- `lib/client-api.js` للطلبات التفاعلية المعتمدة على الجلسة.

### الترجمة محورية وليست ثانوية
- معظم النصوص لا تُكتب داخل المكونات مباشرة.
- بدل ذلك تُقرأ من `locales/*.json` عبر `useLanguage()` و `t()`.

### الواجهة مرتبطة مباشرة بالـ backend
- الصور وملفات PDF لا تُخزن داخل Next.js.
- يتم جلبها من Django مع تعديل الرابط عبر `resolveBackendFileUrl()`.

### توجد مسارات انتقالية Legacy
- `/cataloge`
- `/documents`
- `/staff-dashboard`

هذه المسارات موجودة للحفاظ على التوافق، لكنها تعيد التوجيه لمسارات أحدث.

## 11. ترتيب قراءة مقترح لمطور يستلم الـ frontend

إذا أراد العميل أو المطور الجديد فهم الواجهة بسرعة، فالأفضل أن يبدأ بهذا الترتيب:

1. `frontend/app/layout.js`
2. `frontend/lib/backend-url.js`
3. `frontend/lib/client-api.js`
4. `frontend/lib/i18n.js`
5. `frontend/components/layout/site-header.js`
6. `frontend/app/catalogue/page.js`
7. `frontend/app/items/[id]/page.js`
8. `frontend/components/auth/signup-form.js`
9. `frontend/app/tenant-dashboard/page.js`
10. `frontend/components/admin/staff-dashboard-page.js`

## 12. خلاصة معمارية الـ frontend

يمكن تلخيص الواجهة الأمامية في أربع طبقات:

1. طبقة المسارات: `app/`
2. طبقة المكونات القابلة لإعادة الاستخدام: `components/`
3. طبقة الخدمات والتكامل: `lib/`
4. طبقة النصوص والبيانات الثابتة: `locales/` و `data/`

بهذا التقسيم، يصبح من السهل على أي مطور جديد معرفة أين يذهب إذا أراد:

- تعديل صفحة: يذهب إلى `app/`
- تعديل واجهة مشتركة: يذهب إلى `components/`
- تعديل اتصال API: يذهب إلى `lib/client-api.js`
- تعديل نصوص أو ترجمة: يذهب إلى `locales/*.json`
