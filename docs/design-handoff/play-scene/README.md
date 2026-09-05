# حزمة تسليم: «المشتبه» — شاشة اللعب (عرض المشهد) · حاسوب ١٢٨٠

## نظرة عامة

هذه الحزمة تصف الاتجاه البصري المعتمد لشاشة اللعب الرئيسية في لعبة «المشتبه» (لعبة ألغاز
تحقيق عربية، RTL). الشاشة تعرض: ترويسة الملف، شريط أدوات، عمود بطاقات الشهود على اليمين،
وخريطة مسرح الجريمة (شبكة حتى ١٦×١٦ مقسّمة إلى غرف مسمّاة) في الوسط، والقواعد العامة أسفلها.

**المنطق والبيانات وترتيب العناصر لا تُمس.** كل ما في هذه الحزمة تغييرات في الطبقة البصرية
(ألوان، حدود، ظلال، أحجام خط، ترتيب داخلي للترويسة) تُطبَّق على الأنماط الحالية.

## عن ملفات التصميم

الملفات المرفقة هنا **مراجع تصميم مكتوبة بـ HTML** — نموذج يوضح الشكل والسلوك المقصود،
وليست شفرة إنتاج تُنسخ كما هي. المطلوب: **إعادة إنتاج هذا التصميم داخل بيئة المشروع الحالية**
(المشروع الحالي: تطبيق ويب، الأنماط في `web/app/style.css`، والفن في `web/art/`) باستخدام
أسماء الأصناف (classes) الموجودة فعلًا، لا استبدال البنية.

الملف `style-patch.css` في هذه الحزمة مكتوب أصلًا على أسماء أصناف المشروع الحالية، فهو
أقرب شيء إلى تطبيق مباشر: راجعه سطرًا سطرًا وادمجه في `style.css`.

## درجة الإتمام

**عالية الدقة (hi-fi).** الألوان والخطوط والمسافات والحدود والظلال نهائية بقيمها الدقيقة
المذكورة أدناه. أعِد إنتاج الواجهة بأمانة لهذه القيم.

المتبقي ولم يُصمَّم بعد في هذه الحزمة: الصفحة الرئيسية، عرض المخطط كلوحة مستقلة، الجوال ٣٩٠،
لوح التلميح كلوحة مستقلة، إغلاق القضية، نمط الشاهد الكاذب، دليل «كيف ألعب»، ولوحة نظام
التصميم بالوضع الداكن. لا تخترع هذه الشاشات من عندك؛ انتظر لوحاتها.

---

## قواعد لا تُكسر

1. الواجهة كلها RTL.
2. العمود ١ أقصى اليمين، الصف ١ أعلى. ترقيم الصفوف والأعمدة ظاهر دائمًا وثابت (sticky) أثناء التمرير.
3. الشمال أعلى الخريطة، الشرق يمين الشاشة.
4. جدران الغرف سميكة (٣px حبر) وخطوط الخلايا داخل الغرفة رفيعة (١px). اسم كل غرفة داخلها.
5. الغرف المقيّدة مظلّلة بخطوط مائلة ٤٥°.
6. حالات الخلية الثلاث تتميّز **بالشكل** لا باللون فقط: `✗` نص، القلم دائرة متقطعة بحرفين، الشخصية أفاتار.
7. الشخصية المثبّتة يجب أن يُعرف مربعها فورًا في شبكة ١٦×١٦: حلقة ظل بيضاوية على الأرضية + تعميق مركزي + لوحة اسم.
8. الأثاث في الزاوية العلوية اليسرى للخلية بحجم ≤ ٤٤٪، والشخصية في المنتصف.
9. أزرار الجوال بحجم الإبهام (≥ ٤٤px). لا ضغط مطوّل، لا سحب إجباري، لا إيماءات مخفية.
10. البطاقة لا تقطع جملتها: `text-wrap: pretty` ولا `height` ثابت ولا `nowrap`.
11. لا نصوص إنجليزية في الواجهة. الأرقام كلها هندية-عربية (٠١٢٣٤٥٦٧٨٩).

---

## ما تغيّر عن الحالي ولماذا

١. **فصل ترويسة الملف عن شريط الأدوات في سطرين.** الترتيب نفسه محفوظ، لكن السطر الأول للهوية
(الملفات › · رقم الملف · العنوان · ختم الدرجة) والسطر الثاني للأدوات، مع فواصل رأسية
تجمع الأدوات في عناقيد: (مشهد/مخطط) · (الإضاءة) · (تراجع/إعادة) · (تلميح/مسح) · (تسليم).
السبب: شريط واحد بثمانية أزرار وعنوان يقرأ كصف عشوائي.

٢. **لوحة أرضيات محسّنة.** خُفض تشبّع كل الخامات وحُصرت إضاءتها في نطاق ضيق (L ≈ ٠٫٨٤–٠٫٩٢)
ما عدا السجّاد وحده (L ≈ ٠٫٦٨)، فبقيت `✗` والقلم مقروءة فوق كل خامة. البرتقالي الحالي كان
أعلى تشبّعًا من أن يُقرأ فوقه حبر.

٣. **الجدران.** ٣px حبر على كل حدّ بين غرفتين (يتضاعف بصريًا إلى ٦px عند التقاء الغرفتين)
مقابل ١px داخل الغرفة، مع `box-sizing: border-box` حتى لا تتحرك الشبكة.

٤. **أسماء الغرف شرائح ورقية**: خلفية ورق فاتحة + إطار حبر ١px + ظل ١px، بدل النص العائم
الذي كانت الخامة تشوّشه.

٥. **الشخصية المثبّتة**: حلقة ظل بيضاوية على أرضية الخلية + تدرّج شعاعي خفيف في مركز الخلية
+ لوحة اسم حبرية أسفل الأفاتار.

٦. **ترقيم الصفوف والأعمدة** داخل شريط رمادي (`#e4dcca`) بحدود، وأرقام مضاعفات ٥ بلون الحبر
وبوزن ٧٠٠، فيسهل العدّ في الشبكات الكبيرة.

٧. **شريط اتجاه صغير فوق الخريطة**: وسم «الشمال ↑» + سطر «العمود ١ أقصى اليمين · الصف ١ أعلى ·
الشرق يمين الشاشة». عنصر جديد، لأن كل الأدلة تتكلم بالجهات.

٨. **البطاقات**: الضحية بورق أفتح (`#f8f3e8`) وإطار حبر داكن؛ المشطوبة تنزل لآخر العمود
(`order: 99`)؛ المثبّتة تحمل وسم «مثبّتة» بدبوس أحمر ٦px بدل الاعتماد على اللون وحده.

---

## متغيّرات التصميم (Tokens)

### الألوان — الوضع الفاتح

| المتغيّر | القيمة | الاستخدام |
|---|---|---|
| `--paper` | `#f4eee2` | خلفية الصفحة، ورق الترويسة |
| `--paper-2` | `#ebe3d3` | البطاقات، الأزرار العادية، خلفية اللوحة |
| `--paper-3` | `#e1d7c3` | خلفية الأفاتار، أسطح غائرة |
| `--paper-bar` | `#f0e9dc` | **جديد** — خلفية شريط الأدوات |
| `--paper-slip` | `#f8f4eb` | **جديد** — شريحة اسم الغرفة |
| `--paper-victim` | `#f8f3e8` | **جديد** — ورق بطاقة الضحية |
| `--hdr-bg` | `#e4dcca` | **جديد** — شريط ترقيم الصفوف والأعمدة |
| `--ink` | `#1d1a16` | النص الأساسي، الحدود الحبرية |
| `--ink-2` | `#4a453c` | نص ثانوي، نص البطاقة |
| `--muted` | `#7d766a` | نص خافت، أرقام غير مضاعفات ٥ |
| `--line` | `#d3c9b5` | حدود فاتحة |
| `--line-2` | `#cec3ad` | **جديد** — حدود الأزرار (أغمق قليلًا للتباين) |
| `--line-hdr` | `#c9bfa8` | **جديد** — حدود شريط الترقيم |
| `--wall` | `#2a251f` | جدران الغرف (مشهد) |
| `--pen` | `#1f4fb8` | القلم، التحديد، صنف «أهل البيت» |
| `--pen-wash` | `#dde5fa` | هالة التحديد |
| `--pen-wash-2` | `#eaf0fd` | **جديد** — خلفية وسم «أهل البيت» |
| `--pen-line` | `#bcccf0` | **جديد** — حدّ وسم «أهل البيت» |
| `--wax` | `#c8392b` | زر التسليم، الدبوس، الأختام |
| `--wax-edge` | `#a72d21` | **جديد** — حدّ زر التسليم |
| `--wax-shadow` | `#8f2519` | **جديد** — ظل زر التسليم الصلب |
| `--alert` | `#b8321f` | مخالفة |
| `--alert-wash` | `#f8e1dc` | خلفية المخالفة |
| `--good` | `#2b6b45` | نجاح، درجة «سهل» |
| `--good-wash` | `#dff0e5` | |
| `--hint` | `#8a5a00` | التلميح، درجة «صعب»، صنف «الضيوف» |
| `--hint-ink` | `#6f4900` | **جديد** — نص فوق ورق التلميح (تباين ٥٫١:١) |
| `--hint-wash` | `#fff1cf` | لوح التلميح، زر التلميح |
| `--hint-line` | `#d9b467` | **جديد** — حدّ زر التلميح |
| `--hint-line-2` | `#ddc593` | **جديد** — حدّ وسم «الضيوف» |
| `--hint-wash-2` | `#fdf3dd` | **جديد** — خلفية وسم «الضيوف» |
| `--desk` | `#ded7c8` | خلفية اللوحة خارج التطبيق (للعروض فقط) |

### الألوان — الوضع الداكن

يُبقى على تعريفات `prefers-color-scheme: dark` الحالية، وتُضاف مقابلات الجديد:

| المتغيّر | القيمة الداكنة |
|---|---|
| `--paper` | `#171410` |
| `--paper-2` | `#211d17` |
| `--paper-3` | `#2b261e` |
| `--paper-bar` | `#1c1813` |
| `--paper-slip` | `#2b261e` |
| `--paper-victim` | `#241f19` |
| `--hdr-bg` | `#231f18` |
| `--ink` | `#efe9dc` |
| `--ink-2` | `#cfc7b7` |
| `--muted` | `#948b7a` |
| `--line` | `#3a3529` |
| `--line-2` | `#463f31` |
| `--line-hdr` | `#4a4335` |
| `--wall` | `#e6dfd0` |
| `--pen` | `#7fa2ff` · `--pen-wash` `#1b2740` · `--pen-wash-2` `#182238` · `--pen-line` `#2f426b` |
| `--wax` | `#e2513f` · `--wax-edge` `#b23a2c` · `--wax-shadow` `#7d2318` |
| `--alert` | `#ff7a66` · `--alert-wash` `#3a1a15` |
| `--good` | `#6fcf97` · `--good-wash` `#14291d` |
| `--hint` | `#ffcf6b` · `--hint-ink` `#ffe0a3` · `--hint-wash` `#3a2b08` · `--hint-line` `#6b5216` · `--hint-line-2` `#5c4715` · `--hint-wash-2` `#332609` |
| `--desk` | `#0f0d0a` |

### الخطوط

- **العناوين والأزرار والأختام والأسماء والأرقام**: `Tajawal` (Google Fonts) — أوزان ٤٠٠ / ٥٠٠ / ٧٠٠ / ٨٠٠.
- **النصوص والكلام**: `Noto Naskh Arabic` — أوزان ٤٠٠ / ٧٠٠.
- بقيت الخطوط الحالية كما هي؛ لا تغيير. مبرّر الإبقاء: Tajawal هندسي واضح في المقاسات الصغيرة
(أرقام الشبكة ١١px)، والنسخ أنسب لكلام الشهود الطويل.

```html
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800&family=Noto+Naskh+Arabic:wght@400;500;700&display=swap" rel="stylesheet">
```

### مقاس الخط

| الاستخدام | الحجم | الوزن | الخط | line-height |
|---|---|---|---|---|
| عنوان القضية (h1) | 24px | 800 | Tajawal | 1.2 |
| ختم الدرجة | 14px | 800 | Tajawal | — (letter-spacing .06em) |
| رقم الملف (chip) | 12px | 400 | Tajawal | — (letter-spacing .04em) |
| أزرار الأدوات | 13px | 500 | Tajawal | — |
| زر التسليم | 15px | 800 | Tajawal | — |
| عدّادات الأزرار | 12px | 700 | Tajawal | — |
| اسم الشاهد | 15px | 700 | Tajawal | 1.5 |
| وسم الصنف | 11px | 500 | Tajawal | — |
| كلام الشاهد | 14px | 400 | Noto Naskh | 1.7 |
| عنوان «القواعد العامة» | 14px | 800 | Tajawal | — |
| نص القواعد | 14px | 400 | Noto Naskh | 1.7 |
| السطر الإرشادي | 13px | 400 | Noto Naskh | 1.7 |
| أرقام الشبكة | `round(cell × .25)` (١١px عند ٤٤) | 400 / 700 لمضاعفات ٥ | Tajawal | — |
| اسم الغرفة (شريحة) | `round(cell × .24)` (١١px) | 700 | Tajawal | 1.55 |
| اسم الشخصية (لوحة) | `round(cell × .21)` (٩px، بحد أدنى ٩) | 500 | Tajawal | 1.5 |
| علامة ✗ | `round(cell × .46)` (٢٠px) | 700 | Tajawal | 1 |
| حرفا القلم | `round(cell × .27)` (١٢px) | 700 | Tajawal | — |
| نص لوح التلميح | 15px | 400 | Noto Naskh | 1.85 |

### المسافات

سلّم ٢px: `2 · 3 · 6 · 8 · 9 · 10 · 12 · 14 · 16 · 20 · 26`.
- حشو الترويسة: `13px 20px 11px`
- حشو شريط الأدوات: `9px 20px`، فجوة `8px`
- حشو أزرار الأدوات: `8px 13px`؛ زر التسليم `9px 20px`
- المسرح: `padding: 16px 20px 0`، `gap: 16px`
- عمود البطاقات: عرض `320px`، فجوة `8px`، `max-height: 826px`، `overflow-y: auto`
- حشو البطاقة: `10px 12px 11px 26px` (الحشو الأيسر ٢٦px لمكان زر الشطب)
- حشو صندوق القواعد: `12px 15px`

### الزوايا

`2px` شريحة الغرفة ولوحة الاسم · `3px` الوسوم والرقائق · `6px` البطاقات والأختام واللوحة وصندوق القواعد ·
`8px` أزرار الترويسة · `9px` أزرار الأدوات وزر التسليم · `10px` إطار الشاشة · `50%` الأفاتار والقلم ·
`99px` وسم الاتجاه وعدّادات الأزرار.

### الظلال

| الاسم | القيمة |
|---|---|
| بطاقة عادية | `0 1px 2px rgba(0,0,0,.06)` |
| بطاقة محدّدة | `0 0 0 3px var(--pen-wash), 0 7px 16px rgba(0,0,0,.12)` + `translateY(-2px)` |
| أفاتار | `0 1px 2px rgba(0,0,0,.22)` |
| اللوحة (مشهد) | `0 12px 32px rgba(0,0,0,.14)` |
| اللوحة (مخطط) | `0 4px 14px rgba(0,0,0,.1)` |
| زر التسليم | `0 2px 0 var(--wax-shadow), 0 7px 16px rgba(200,57,43,.28)` |
| شريحة اسم الغرفة | `0 1px 2px rgba(0,0,0,.28)` (تُلغى في المخطط) |
| لوح التلميح | `0 -10px 28px rgba(0,0,0,.18)` |
| نقش الخلية (مشهد) | `inset 1px 1px 0 rgba(255,255,255,.32), inset -1px -1px 0 rgba(0,0,0,.07)` |

---

## لوحة الأرضيات المحسّنة (الأنواع العشرة)

`cell` الافتراضي ٤٤px. الأنماط CSS خالصة — لا صور. كلها تحت `.view-scene`؛ في `.view-plan`
تُلغى كلها ويصبح لون الخلية `#fbf8f1` (وفي الداكن `#23201a`).

| النوع | لون الأساس | النقش |
|---|---|---|
| سجّاد | `#bf8272` | `repeating-linear-gradient(45deg, rgba(255,255,255,.11) 0 5px, transparent 5px 11px), repeating-linear-gradient(-45deg, rgba(0,0,0,.07) 0 5px, transparent 5px 11px)` |
| بلاط | `#e4dccc` | `linear-gradient(rgba(0,0,0,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,.07) 1px, transparent 1px)` · size `22px 22px` |
| رخام | `#ece6da` | `linear-gradient(115deg, rgba(0,0,0,.05) 0 2px, transparent 2px 42%), linear-gradient(68deg, rgba(0,0,0,.035) 0 1px, transparent 1px 60%)` |
| حجر | `#d8d1c2` | `repeating-linear-gradient(0deg, rgba(0,0,0,.09) 0 1px, transparent 1px 15px), repeating-linear-gradient(90deg, rgba(0,0,0,.07) 0 1px, transparent 1px 21px)` |
| خشب | `#d3b48f` | `repeating-linear-gradient(90deg, rgba(0,0,0,.09) 0 1px, transparent 1px 12px), linear-gradient(rgba(255,255,255,.07), rgba(0,0,0,.05))` |
| عشب | `#c1c9a4` | `radial-gradient(rgba(0,0,0,.1) .8px, transparent 1px)` · size `7px 7px` |
| ماء | `#b9cbd2` | `repeating-linear-gradient(0deg, rgba(255,255,255,.32) 0 1.5px, transparent 1.5px 9px)` |
| إسمنت | `#d6d1c7` | `radial-gradient(rgba(0,0,0,.07) .7px, transparent .8px)` · size `5px 5px` |
| رمل | `#e6d9bd` | `radial-gradient(rgba(0,0,0,.08) .7px, transparent .8px)` · size `6px 6px` |
| قش | `#dfd0a8` | `repeating-linear-gradient(28deg, rgba(0,0,0,.09) 0 1px, transparent 1px 6px), repeating-linear-gradient(-32deg, rgba(0,0,0,.06) 0 1px, transparent 1px 8px)` |

**اختبار القراءة**: `✗` بلون `--ink` مع هالة `text-shadow: 0 0 3px rgba(248,244,235,.95), 0 0 7px rgba(248,244,235,.8)`
تُقرأ فوق العشرة جميعًا. القلم بخلفية `rgba(248,244,235,.72)` كذلك.

---

## بنية الشاشة

عرض التصميم `1280px`. الإطار: `border: 1px solid #b7ae9d; border-radius: 10px; overflow: hidden; position: relative`.

```
┌──────────────────────────────────────────────────────────────┐
│ ترويسة الملف   [الملفات ›][ملف ٠١٩ · بيت · ١٦×١٦] العنوان [ختم]  ⟵ ١٦ مشتبهًا · ١٠ غرف │
├──────────────────────────────────────────────────────────────┤
│ الأدوات  [مشهد|مخطط] │ [● نهار] │ [تراجع][إعادة] │ [تلميح ٢/١٢][مسح] ⟵⟵ [تسليم ٧/١٦] │
├──────────────────────────────────────────────────────────────┤
│  ┌── الخريطة ───────────────────────────────┐ ┌ بطاقات ٣٢٠px ┐ │
│  │ [الشمال ↑] العمود ١ أقصى اليمين …        │ │ الضحية       │ │
│  │ ┌ لوحة ──────────────────────────────┐   │ │ شاهد…        │ │
│  │ │ ترقيم الأعمدة (sticky top)         │   │ │ شاهد…        │ │
│  │ │ ترقيم الصفوف (sticky right) + خلايا│   │ │ …            │ │
│  │ └────────────────────────────────────┘   │ │              │ │
│  └──────────────────────────────────────────┘ └──────────────┘ │
│  [القواعد العامة + السطر الإرشادي]           [كيف ألعب؟]        │
└──────────────────────────────────────────────────────────────┘
```

المسرح: `display: grid; grid-template-columns: 320px 1fr; gap: 16px` — عمود البطاقات أولًا في
شفرة المصدر فيظهر يمينًا في RTL.

### ١. ترويسة الملف

`display: flex; align-items: center; gap: 12px; padding: 13px 20px 11px; background: var(--paper); border-bottom: 1px solid var(--line)`

- **زر «الملفات ›»**: Tajawal 13/500، `color: var(--ink-2)`، `background: var(--paper-2)`، `border: 1px solid var(--line)`، `radius 8`، `padding: 7px 13px`.
- **رقاقة رقم الملف**: «ملف ٠١٩ · بيت · ١٦×١٦» — Tajawal 12، `color: var(--muted)`، `letter-spacing .04em`، `border: 1px solid var(--line)`، `radius 3`، `padding: 3px 9px`.
- **العنوان**: «ليلة العزيمة» — Tajawal 24/800، `margin: 0`.
- **ختم الدرجة**: Tajawal 14/800، `letter-spacing .06em`، `border: 3px double <لون الدرجة>`، `radius 6`، `padding: 1px 11px`، `transform: rotate(-6deg)`، `opacity: .92`. ألوان الدرجات: سهل `--good` · متوسط `--pen` · صعب `--hint` · خبير `--wax`.
- **يسار الشريط** (بعد `flex: 1`): «١٦ مشتبهًا · ١٠ غرف» — Tajawal 12 `--muted`.

### ٢. شريط الأدوات

`display: flex; align-items: center; gap: 8px; padding: 9px 20px; background: var(--paper-bar); border-bottom: 2px solid var(--ink)`
ثابت أعلى الشاشة (`position: sticky; top: 0; z-index: 20`) في التطبيق الحقيقي.

الترتيب من اليمين، والفاصل بين العناقيد `div` بعرض `1px` وارتفاع `22px` بلون `--line`:

1. **مقسّم العرض** `[مشهد | مخطط]`: `display: inline-flex; border: 1px solid var(--line-2); radius 9; overflow: hidden`. الزر النشط `background: var(--ink); color: var(--paper); font-weight: 700`؛ الخامل `background: var(--paper-2); color: var(--ink); font-weight: 500`. كلاهما `border: none; padding: 8px 17px; font-size: 13px`.
2. **الإضاءة**: زر واحد يدوّر نهار → غروب → ليل (كما هو الآن، لم يتغيّر السلوك). داخله دائرة `11px` `border-radius: 50%` `border: 1px solid rgba(0,0,0,.25)` بلون: نهار `#e2a33a` · غروب `#c96a3c` · ليل `#2c3a72`، ثم نص الحالة. `gap: 7px`.
3. **تراجع / إعادة**: زر عادي. المعطّل `opacity: .45; cursor: default`.
4. **تلميح**: `background: var(--hint-wash); color: var(--hint-ink); border: 1px solid var(--hint-line)`، وداخله عدّاد `«٢/١٢»` في رقاقة `background: rgba(138,90,0,.14); radius 99; padding: 1px 8px; font-size: 12`.
5. **مسح العلامات**: زر شبح `background: transparent; color: var(--ink-2); border: 1px solid var(--line-2)`.
6. `flex: 1` فاصل.
7. **تسليم**: `background: var(--wax); color: #fff; border: 1px solid var(--wax-edge); radius 9; padding: 9px 20px; font: Tajawal 15/800`، ظل `0 2px 0 var(--wax-shadow), 0 7px 16px rgba(200,57,43,.28)`، وعدّاد `«٧/١٦»` في رقاقة `background: rgba(255,255,255,.22); radius 99; padding: 2px 9px; font-size: 12/700`.

**أنماط الأزرار الأربعة**: أساسي (شمعي، أعلاه) · عادي (`--paper-2` + `--line-2`) · شبح (`transparent` + `--line-2`) · معطّل (`opacity: .45; cursor: default`).
Hover على العادي والشبح: `border-color: var(--ink)`.

### ٣. شريط الاتجاه (فوق الخريطة)

`display: flex; align-items: center; gap: 12px`
- وسم «الشمال ↑»: Tajawal 12/700، `--ink-2`، `border: 1px solid var(--line-2)`، `background: var(--paper-2)`، `radius 99`، `padding: 3px 11px`، والسهم `font-size: 14`.
- سطر: «العمود ١ أقصى اليمين · الصف ١ أعلى · الشرق يمين الشاشة» — 12px `--muted`.

### ٤. اللوحة (الخريطة)

`overflow: auto; width: fit-content; max-width: 100%; margin: 0 auto; border: 2px solid var(--ink); border-radius: 6; background: var(--paper-2)` + ظل اللوحة.
الداخل `position: relative; width: max-content`؛ الصفوف `display: flex` (فتتبع RTL تلقائيًا فيصير العمود ١ يمينًا).

**شريط الترقيم**: `--hdr-bg`، `26px` عرضًا/ارتفاعًا، Tajawal بحجم `cell × .25`.
- صف الأعمدة: `position: sticky; top: 0; z-index: 9`، `border-bottom: 1px solid var(--line-hdr)`، وفاصل `border-left: 1px solid rgba(0,0,0,.06)` بين الخلايا.
- عمود الصفوف: `position: sticky; right: 0; z-index: 7`، `border-left: 1px solid var(--line-hdr)`.
- الزاوية: `sticky` في الاتجاهين، `z-index: 10`.
- مضاعفات ٥: `color: var(--ink); font-weight: 700`. غيرها: `color: var(--muted); font-weight: 400`.

**الخلية**: `position: relative; box-sizing: border-box; width/height: cell; display: grid; place-items: center; overflow: visible; cursor: pointer`.
- الحدود تُحسب من الغرف: كل حدّ يلامس غرفة أخرى (أو خارج الشبكة) = `3px solid var(--wall)`؛ وإلا `1px solid rgba(0,0,0,.14)` (مشهد) / `rgba(0,0,0,.22)` (مخطط).
- الأرضية من الجدول أعلاه + نقش الخلية `inset` (مشهد فقط).
- **مقيّدة**: طبقة `::before` — `inset: 0; background-image: repeating-linear-gradient(45deg, transparent 0 6px, rgba(0,0,0,.13) 6px 7.5px)` (مخطط: `.19`).
- **مشغولة**: يُضاف قبل نقش الأرضية `radial-gradient(circle at 50% 62%, rgba(0,0,0,.17), rgba(0,0,0,0) 62%)`.
- **مرتبطة بدليل**: `box-shadow: inset 0 0 0 3px var(--pen)`.
- **مخالفة**: `box-shadow: inset 0 0 0 3px var(--alert)`.
- **مظلّلة خارج التركيز**: `opacity: .28`.

**الأثاث**: `position: absolute; top: 7–8%; left: 7%; pointer-events: none; z-index: 1`.
مستطيل `44% × 30%; radius 2` أو دائرة `34% × 34%; radius 50%`؛ `border: 1.5px solid #3a332a` (مخطط: `--ink`)، `background: rgba(255,255,255,.32)` (مخطط: `transparent`).

**علامة ✗**: Tajawal `cell × .46`/700، `--ink`، `z-index: 3` + الهالة المذكورة.

**علامة القلم**: دائرة `cell × .62`، `border: 1.5px dashed var(--pen)`، `radius 50%`، `color: var(--pen)`، `background: rgba(248,244,235,.72)`، Tajawal `cell × .27`/700، حرفان، `z-index: 3`.

**الشخصية المثبّتة** — حاوية `position: relative; width/height: cell × .9; display: grid; place-items: center; z-index: 5`:
1. حلقة الظل: `position: absolute; bottom: 6%; left: 50%; translateX(-50%); width: 88%; height: 26%; radius 50%; background: radial-gradient(ellipse at center, rgba(0,0,0,.42), rgba(0,0,0,0) 70%); z-index: 1`.
2. الأفاتار: `72% × 72%`، دائري، `background: var(--paper-3)`، `border: 2px solid <لون الصنف>`، `overflow: hidden`، ظل الأفاتار، `z-index: 2`.
3. لوحة الاسم: `position: absolute; bottom: -8px; left: 50%; translateX(-50%); background: var(--ink); color: var(--paper); padding: 0 5px; radius 2; white-space: nowrap; z-index: 8`.

**شريحة اسم الغرفة**: `position: absolute; bottom: 2px; left: 50%; translateX(-50%); background: var(--paper-slip); border: 1px solid var(--ink); radius 2; padding: 0 5px; white-space: nowrap; z-index: 6` + ظل الشريحة. تُوضع في خلية واحدة مختارة داخل الغرفة (تُفضّل خلية بلا شخصية).

**طبقة الإضاءة**: `position: absolute; inset: 0; pointer-events: none; z-index: 4; mix-blend-mode: multiply` فوق الشبكة وتحت الشخصيات (`z-index: 5`) والشرائح (`6`).
- نهار: لا طبقة.
- غروب: `linear-gradient(160deg, rgba(255,150,60,.2), rgba(120,40,90,.22))`.
- ليل: `linear-gradient(160deg, rgba(20,30,80,.5), rgba(5,10,40,.55))`.
- في المخطط: لا طبقة إضاءة مهما كانت الحالة.

### ٥. عمود البطاقات

`display: flex; flex-direction: column; gap: 8px; max-height: 826px; overflow-y: auto; padding: 2px 3px 10px`.
على الحاسوب: `position: sticky; top: 3.8rem` كما هو في المشروع الحالي.

**البطاقة** — `position: relative; display: flex; gap: 10px; align-items: flex-start; background: var(--paper-2); border: 1px solid var(--line); radius 6; padding: 10px 12px 11px 26px; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,.06); transition: transform .12s, box-shadow .12s, border-color .12s`.

الحالات الست:
| الحالة | التغيير |
|---|---|
| عادية | كما أعلاه |
| محدّدة | `border-color: var(--pen)` + ظل التحديد + `translateY(-2px)` |
| مخالفة | `border-color: var(--alert); background: var(--alert-wash)` + نبضة `pulse .6s` مرة واحدة |
| مشطوبة | `opacity: .55; order: 99; background: #e6dfcf` + `text-decoration: line-through` على الكلام |
| الضحية | `background: var(--paper-victim); border: 1px solid var(--wall)`؛ الوسم «الضحية» بإطار حبر وخلفية شفافة؛ لا زر شطب |
| موضوعة على الخريطة | وسم «مثبّتة»: دائرة `6px` بلون `--wax` + نص Tajawal 11/500 `--ink-2` في إطار `1px solid var(--line-2)` `radius 3` `padding: 0 5px` |
| (نمط الشاهد الكاذب) مكذَّبة | `border: 1px dotted var(--alert)` + `opacity: .6` على الكلام + وسم بلون `--alert` |

**الأفاتار في البطاقة**: `46px`، دائري، `border: 2px solid <لون الصنف>`، `background: var(--paper-3)`، `overflow: hidden`، ظل الأفاتار.
**ألوان حلقة الصنف**: أهل البيت / العاملون `--pen` · الضيوف / الزبائن `--hint` · الضحية `--wall`.
**وسم الصنف**: أهل البيت `color: var(--pen); background: var(--pen-wash-2); border: 1px solid var(--pen-line)` · الضيوف `color: var(--hint); background: var(--hint-wash-2); border: 1px solid var(--hint-line-2)`.
**زر الشطب**: `position: absolute; top: 6px; left: 7px; background: transparent; border: none; color: #9b9284; font-size: 13; padding: 3px 5px; radius 4`. Hover: `color: var(--pen)`.
**كلام الشاهد**: `text-wrap: pretty`، لا ارتفاع ثابت — البطاقة تتمدد.

### ٦. القواعد العامة

صف من صندوقين: صندوق القواعد `flex: 1`، وزر «كيف ألعب؟» `flex: none` بجانبه، `gap: 14px`.
صندوق القواعد: `background: var(--paper-2); border: 1px solid var(--line); radius 6; padding: 12px 15px`.
عنوان Tajawal 14/800، ثم ٣ أسطر نسخ 14/1.7 `--ink-2` بفجوة `3px`، ثم السطر الإرشادي مفصولًا
بـ `border-top: 1px dashed var(--line-2); padding-top: 9px; margin-top: 9px`، 13px `--muted`.
زر «كيف ألعب؟»: شبح بإطار حبر كامل `1px solid var(--ink)`، Tajawal 13/700، `padding: 10px 16px`.

### ٧. لوح التلميح (نموذج مبدئي — لوحته المستقلة لاحقًا)

`position: fixed; bottom: 0; inset-inline: 0; z-index: 40; background: var(--hint-wash); border-top: 2px solid var(--hint); box-shadow: 0 -10px 28px rgba(0,0,0,.18); max-height: 40%; display: flex; flex-direction: column`.
العنوان «تلميح ٣ من ١٢» Tajawal 16/800 `--hint-ink`، وزر «إغلاق» بإطار `--hint-line`.
النص 15px/1.85 `#3a2f14` بعرض أقصى `70ch`.

---

## التفاعل والسلوك

لا جديد في المنطق. ما تحتاجه الطبقة البصرية فقط:

| الحدث | النتيجة البصرية |
|---|---|
| ضغط بطاقة | حالة «محدّدة» على تلك البطاقة فقط، وإزالتها عن غيرها |
| ضغط زر الإضاءة | تدوير نهار → غروب → ليل، وتغيّر لون الدائرة وطبقة الإضاءة |
| ضغط مشهد/مخطط | تبديل صنف الجذر بين `.view-scene` و`.view-plan` |
| ضغط زر التلميح | فتح/إغلاق اللوح السفلي |
| Hover على خلية | `filter: brightness(.95)` (كما هو الآن) |
| Hover على زر عادي/شبح | `border-color: var(--ink)` |
| تثبيت شخصية | `@keyframes drop` الحالي `.18s ease-out` |
| مخالفة | `@keyframes shake` الحالي `.3s` + `pulse .6s` على البطاقة |
| تحديد | `transition: transform .12s, box-shadow .12s, border-color .12s` |

`@media (prefers-reduced-motion: reduce) { * { animation: none !important; transition: none !important; } }` — يبقى كما هو.

## الحالة (State) المطلوبة للعرض

`view: 'scene' | 'plan'` · `light: 'day' | 'dusk' | 'night'` · `selectedCard: string | null` · `hintOpen: boolean`.
كلها موجودة في التطبيق الحالي؛ لا حاجة لحالة جديدة.

## الأصول

- **الخطوط**: Google Fonts (Tajawal · Noto Naskh Arabic) — كما هي في المشروع.
- **الأرضيات**: لا صور. كلها CSS gradients من الجدول أعلاه — تُطبَّق مكان أصول `web/art/` للأرضيات إن كانت صورًا، أو تُحدَّث ألوان الأصول لتطابق الجدول.
- **الأفاتار**: أبقِ مولّد الأفاتار الحالي في `web/art/` كما هو. الأفاتار في نموذج HTML المرفق
  **بديل هندسي مبدئي** (دوائر ومستطيلات) لأنه لا يمكن رسم الأفاتار الحقيقي في نموذج تصميم —
  المطلوب منه فقط: القياسات (٤٦px في البطاقة، ٧٢٪ من الخلية على الخريطة)، والحلقة `2px` بلون الصنف، والظل.
- **الشعار والأختام**: الشعار الحالي `logo.svg` يبقى. ختم «أُغلقت القضية» يأتي في لوحته لاحقًا.
- **لا أيقونات صورية**: أسهم `↑ ✗ ✕ ›` وأشكال CSS فقط. لا إيموجي في هذه الشاشة (استُبدل 💡 بنص «تلميح» + عدّاد، والشمس بدائرة ملوّنة).

## الملفات في هذه الحزمة

- `README.md` — هذا الملف. مكتفٍ بذاته.
- `style-patch.css` — الأنماط جاهزة على أسماء أصناف المشروع الحالية (`.topbar`, `.btn`, `.cell`, `.card`, `.room-label`, `.token`, `.hdr`, `.prop`…). ادمجها في `web/app/style.css`.
- `Almushtabah - Play Scene.dc.html` — النموذج المرجعي. يُفتح في المتصفح مباشرة. الأزرار
  (مشهد/مخطط، الإضاءة، التلميح، تحديد البطاقة) تعمل فيه للاطلاع على الحالات.

## نقاط تحتاج قرارًا

1. زر الإضاءة: أُبقي زرًا واحدًا يدوّر الحالات كما في التطبيق الحالي، لا مقسّمًا ثلاثيًا — تأكيدًا لقاعدة «لا تغيير في ترتيب الأدوات». إن أردنا الثلاثة ظاهرة معًا فهي تحتاج ~٤٠px إضافية في الشريط.
2. `max-height: 826px` لعمود البطاقات مقاس ثابت للوحة العرض؛ في التطبيق استخدم `calc(100vh - 6rem)` كما هو الآن.
3. القياسات هنا لشبكة ١٦×١٦ بخلية ٤٤px (المجموع ٧٣٠px مع شريط الترقيم) وهي تسع داخل ١٢٨٠ بعد عمود البطاقات. الشبكات الأكبر تعتمد على تمرير اللوحة الأفقي كما هو الآن.
