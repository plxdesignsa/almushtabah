// content.js — المحتوى العربي للمولّد: البيئات وغرفها وأشياؤها، الأسماء، الأصناف.
//
// كل بيئة (theme) تعرّف: الغرف (مع علامة «مقيّدة»)، الأشياء الملائمة لكل غرفة،
// صنفي الشخصيات (من يُسمح له بالغرف المقيّدة ومن يُمنع)، وعناوين القضايا.
// كل المفاتيح لاتينية لأنها تدخل في ملف القضية الرئيسي؛ العربية تذهب لطبقة الترجمة.

export const OBJECTS = {
  table: 'الطاولة', chair: 'الكرسي', carpet: 'السجّادة', cushion: 'المسند', tv: 'التلفاز',
  sofa: 'الكنبة', lamp: 'المصباح', dallah: 'الدلّة', tray: 'الصينية', stove: 'الفرن',
  fridge: 'الثلاجة', sink: 'المغسلة', well: 'البئر', tree: 'الشجرة', fountain: 'النافورة',
  palm: 'النخلة', car: 'السيارة', bed: 'السرير', wardrobe: 'الدولاب', chest: 'الصندوق',
  shelf: 'الرف', desk: 'المكتب', safe: 'الخزنة', washer: 'الغسالة', basket: 'السلة',
  ladder: 'السلّم', sack: 'الكيس', barrel: 'البرميل', bench: 'الدكّة', plant: 'الأصيص',
  mirror: 'المرآة', clock: 'الساعة', trough: 'المعلف', saddle: 'السرج', hay: 'كومة القش',
  pump: 'المضخة', tent: 'الخيمة', fire: 'الموقد', cage: 'القفص', crate: 'الصندوق الخشبي',
  counter: 'الكاونتر', register: 'الصندوق', display: 'الفترينة', scale: 'الميزان',
  coffee: 'ماكينة القهوة', camera: 'الكاميرا', rack: 'الرفوف', cart: 'العربة', sign: 'اللوحة',
  bucket: 'الدلو', stool: 'الكرسي الصغير', fan: 'المروحة', rug: 'البساط',
};

const R = (key, ar, restricted, objects) => ({ key, ar, restricted, objects });

export const THEMES = {
  house: {
    key: 'house',
    titles: ['ليلة العزيمة', 'بيت العائلة', 'عشاء الجمعة', 'الليلة الأخيرة في البيت الكبير', 'سهرة الديوانية'],
    classes: { allowed: 'household', forbidden: 'guest' },
    classNames: { household: 'أهل البيت', guest: 'الضيوف' },
    rooms: [
      R('majlis', 'المجلس', false, ['carpet', 'cushion', 'dallah', 'tray', 'tv']),
      R('diwaniya', 'الديوانية', false, ['carpet', 'cushion', 'tv', 'dallah', 'lamp']),
      R('kitchen', 'المطبخ', false, ['stove', 'fridge', 'sink', 'table', 'tray']),
      R('courtyard', 'الحوش', false, ['well', 'tree', 'bench', 'car', 'plant']),
      R('garden', 'الحديقة', false, ['palm', 'fountain', 'bench', 'plant', 'tree']),
      R('hallway', 'الممر', false, ['mirror', 'clock', 'lamp', 'plant']),
      R('guestroom', 'غرفة الضيوف', false, ['sofa', 'table', 'lamp', 'carpet']),
      R('dining', 'غرفة الطعام', false, ['table', 'chair', 'tray', 'clock']),
      R('roof', 'السطح', false, ['chair', 'basket', 'ladder', 'fan']),
      R('stairs', 'الدرج', false, ['lamp', 'plant', 'mirror']),
      R('store', 'المستودع', true, ['chest', 'shelf', 'sack', 'barrel', 'ladder']),
      R('bedroom', 'غرفة النوم', true, ['bed', 'wardrobe', 'mirror', 'lamp']),
      R('office', 'المكتب', true, ['desk', 'chair', 'safe', 'shelf', 'clock']),
      R('laundry', 'غرفة الغسيل', true, ['washer', 'basket', 'sink', 'shelf']),
      R('garage', 'الكراج', true, ['car', 'chest', 'ladder', 'barrel']),
      R('pantry', 'المؤونة', true, ['shelf', 'sack', 'basket', 'barrel']),
      R('kidsroom', 'غرفة الأطفال', true, ['bed', 'wardrobe', 'chest', 'rug']),
      R('maidroom', 'غرفة الخادمة', true, ['bed', 'chair', 'wardrobe']),
    ],
  },
  farm: {
    key: 'farm',
    titles: ['ما جرى في المزرعة', 'ليلة الحصاد', 'استراحة النخيل', 'الفجر في المزرعة', 'ضيوف الاستراحة'],
    classes: { allowed: 'worker', forbidden: 'visitor' },
    classNames: { worker: 'العمّال', visitor: 'الزوّار' },
    rooms: [
      R('farmhouse', 'بيت المزرعة', false, ['carpet', 'cushion', 'tv', 'dallah']),
      R('majlis', 'المجلس', false, ['carpet', 'cushion', 'dallah', 'tray']),
      R('kitchen', 'المطبخ', false, ['stove', 'fridge', 'sink', 'table']),
      R('yard', 'الساحة', false, ['fire', 'bench', 'car', 'bucket']),
      R('palmgrove', 'بستان النخيل', false, ['palm', 'well', 'ladder', 'basket']),
      R('orchard', 'البستان', false, ['tree', 'basket', 'bench', 'bucket']),
      R('pool', 'البركة', false, ['bench', 'plant', 'chair', 'bucket']),
      R('tent', 'الخيمة', false, ['tent', 'carpet', 'cushion', 'fire', 'dallah']),
      R('gate', 'البوابة', false, ['car', 'sign', 'lamp', 'bench']),
      R('stable', 'الإسطبل', true, ['trough', 'saddle', 'hay', 'bucket']),
      R('barn', 'الحظيرة', true, ['hay', 'trough', 'sack', 'barrel']),
      R('coop', 'عشة الدجاج', true, ['cage', 'basket', 'sack']),
      R('storeroom', 'المخزن', true, ['sack', 'crate', 'shelf', 'barrel']),
      R('toolshed', 'غرفة العدّة', true, ['shelf', 'ladder', 'bucket', 'crate']),
      R('pumproom', 'غرفة المضخة', true, ['pump', 'barrel', 'bucket']),
      R('sheeppen', 'زريبة الغنم', true, ['trough', 'hay', 'bucket']),
      R('camelpen', 'مربط الإبل', true, ['trough', 'saddle', 'hay']),
      R('workers', 'سكن العمّال', true, ['bed', 'chest', 'stool', 'fan']),
    ],
  },
  market: {
    key: 'market',
    titles: ['حادثة السوق', 'قبل الإغلاق بدقائق', 'سوق الذهب', 'ليلة الجرد', 'ممر العطّارين'],
    classes: { allowed: 'staff', forbidden: 'customer' },
    classNames: { staff: 'العاملون', customer: 'الزبائن' },
    rooms: [
      R('entrance', 'المدخل', false, ['sign', 'cart', 'plant', 'camera']),
      R('perfumes', 'محل العطور', false, ['display', 'counter', 'shelf', 'mirror']),
      R('gold', 'محل الذهب', false, ['display', 'counter', 'scale', 'camera']),
      R('abayas', 'محل العبايات', false, ['rack', 'mirror', 'counter', 'chair']),
      R('cafe', 'المقهى', false, ['table', 'chair', 'coffee', 'counter']),
      R('dates', 'محل التمور', false, ['scale', 'crate', 'counter', 'basket']),
      R('spices', 'محل البهارات', false, ['sack', 'scale', 'shelf', 'counter']),
      R('carpets', 'محل السجاد', false, ['carpet', 'rug', 'rack', 'chair']),
      R('corridor', 'الممر', false, ['bench', 'plant', 'sign', 'lamp']),
      R('prayer', 'المصلى', false, ['carpet', 'shelf', 'clock']),
      R('storage', 'المستودع', true, ['crate', 'shelf', 'cart', 'ladder']),
      R('office', 'الإدارة', true, ['desk', 'chair', 'safe', 'camera']),
      R('cashroom', 'غرفة الصندوق', true, ['safe', 'register', 'desk', 'camera']),
      R('cafekitchen', 'مطبخ المقهى', true, ['stove', 'sink', 'fridge', 'coffee']),
      R('loading', 'منصة التحميل', true, ['crate', 'cart', 'barrel', 'car']),
      R('security', 'غرفة الأمن', true, ['camera', 'desk', 'chair', 'tv']),
      R('workshop', 'الورشة', true, ['desk', 'scale', 'shelf', 'lamp']),
      R('archive', 'الأرشيف', true, ['shelf', 'crate', 'desk']),
    ],
  },
};

export const NAMES = {
  m: [
    ['nasser', 'ناصر'], ['khalid', 'خالد'], ['fahd', 'فهد'], ['saud', 'سعود'], ['turki', 'تركي'],
    ['bandar', 'بندر'], ['abdullah', 'عبدالله'], ['mohammed', 'محمد'], ['sultan', 'سلطان'],
    ['faisal', 'فيصل'], ['majed', 'ماجد'], ['talal', 'طلال'], ['nayef', 'نايف'], ['omar', 'عمر'],
    ['yousef', 'يوسف'], ['rakan', 'راكان'], ['mishal', 'مشعل'], ['salman', 'سلمان'],
    ['hamad', 'حمد'], ['ziyad', 'زياد'], ['waleed', 'وليد'], ['ibrahim', 'إبراهيم'],
  ],
  f: [
    ['reem', 'ريم'], ['sara', 'سارة'], ['munira', 'منيرة'], ['noura', 'نورة'], ['haya', 'هيا'],
    ['latifa', 'لطيفة'], ['aljohara', 'الجوهرة'], ['shahad', 'شهد'], ['dana', 'دانة'],
    ['ghada', 'غادة'], ['abeer', 'عبير'], ['maha', 'مها'], ['alanoud', 'العنود'], ['lama', 'لمى'],
    ['arwa', 'أروى'], ['jawaher', 'جواهر'], ['hessa', 'حصة'], ['amal', 'أمل'],
    ['rana', 'رنا'], ['salma', 'سلمى'], ['wejdan', 'وجدان'], ['nada', 'ندى'],
  ],
};

export const THEME_KEYS = Object.keys(THEMES);
