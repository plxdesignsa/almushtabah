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

const R = (key, ar, restricted, objects, floor) => ({ key, ar, restricted, objects, floor });

export const THEMES = {
  house: {
    key: 'house',
    titles: ['ليلة العزيمة', 'بيت العائلة', 'عشاء الجمعة', 'الليلة الأخيرة في البيت الكبير', 'سهرة الديوانية'],
    classes: { allowed: 'household', forbidden: 'guest' },
    classNames: { household: 'أهل البيت', guest: 'الضيوف' },
    rooms: [
      R('majlis', 'المجلس', false, ['carpet', 'cushion', 'dallah', 'tray', 'tv'], 'rug'),
      R('diwaniya', 'الديوانية', false, ['carpet', 'cushion', 'tv', 'dallah', 'lamp'], 'rug'),
      R('kitchen', 'المطبخ', false, ['stove', 'fridge', 'sink', 'table', 'tray'], 'tile'),
      R('courtyard', 'الحوش', false, ['well', 'tree', 'bench', 'car', 'plant'], 'stone'),
      R('garden', 'الحديقة', false, ['palm', 'fountain', 'bench', 'plant', 'tree'], 'grass'),
      R('hallway', 'الممر', false, ['mirror', 'clock', 'lamp', 'plant'], 'tile'),
      R('guestroom', 'غرفة الضيوف', false, ['sofa', 'table', 'lamp', 'carpet'], 'rug'),
      R('dining', 'غرفة الطعام', false, ['table', 'chair', 'tray', 'clock'], 'tile'),
      R('roof', 'السطح', false, ['chair', 'basket', 'ladder', 'fan'], 'concrete'),
      R('stairs', 'الدرج', false, ['lamp', 'plant', 'mirror'], 'tile'),
      R('store', 'المستودع', true, ['chest', 'shelf', 'sack', 'barrel', 'ladder'], 'concrete'),
      R('bedroom', 'غرفة النوم', true, ['bed', 'wardrobe', 'mirror', 'lamp'], 'wood'),
      R('office', 'المكتب', true, ['desk', 'chair', 'safe', 'shelf', 'clock'], 'wood'),
      R('laundry', 'غرفة الغسيل', true, ['washer', 'basket', 'sink', 'shelf'], 'tile'),
      R('garage', 'الكراج', true, ['car', 'chest', 'ladder', 'barrel'], 'concrete'),
      R('pantry', 'المؤونة', true, ['shelf', 'sack', 'basket', 'barrel'], 'concrete'),
      R('kidsroom', 'غرفة الأطفال', true, ['bed', 'wardrobe', 'chest', 'rug'], 'wood'),
      R('maidroom', 'غرفة الخادمة', true, ['bed', 'chair', 'wardrobe'], 'wood'),
    ],
  },
  farm: {
    key: 'farm',
    titles: ['ما جرى في المزرعة', 'ليلة الحصاد', 'استراحة النخيل', 'الفجر في المزرعة', 'ضيوف الاستراحة'],
    classes: { allowed: 'worker', forbidden: 'visitor' },
    classNames: { worker: 'العمّال', visitor: 'الزوّار' },
    rooms: [
      R('farmhouse', 'بيت المزرعة', false, ['carpet', 'cushion', 'tv', 'dallah'], 'rug'),
      R('majlis', 'المجلس', false, ['carpet', 'cushion', 'dallah', 'tray'], 'rug'),
      R('kitchen', 'المطبخ', false, ['stove', 'fridge', 'sink', 'table'], 'tile'),
      R('yard', 'الساحة', false, ['fire', 'bench', 'car', 'bucket'], 'stone'),
      R('palmgrove', 'بستان النخيل', false, ['palm', 'well', 'ladder', 'basket'], 'sand'),
      R('orchard', 'البستان', false, ['tree', 'basket', 'bench', 'bucket'], 'grass'),
      R('pool', 'البركة', false, ['bench', 'plant', 'chair', 'bucket'], 'water'),
      R('tent', 'الخيمة', false, ['tent', 'carpet', 'cushion', 'fire', 'dallah'], 'rug'),
      R('gate', 'البوابة', false, ['car', 'sign', 'lamp', 'bench'], 'stone'),
      R('stable', 'الإسطبل', true, ['trough', 'saddle', 'hay', 'bucket'], 'hay'),
      R('barn', 'الحظيرة', true, ['hay', 'trough', 'sack', 'barrel'], 'hay'),
      R('coop', 'عشة الدجاج', true, ['cage', 'basket', 'sack'], 'hay'),
      R('storeroom', 'المخزن', true, ['sack', 'crate', 'shelf', 'barrel'], 'concrete'),
      R('toolshed', 'غرفة العدّة', true, ['shelf', 'ladder', 'bucket', 'crate'], 'concrete'),
      R('pumproom', 'غرفة المضخة', true, ['pump', 'barrel', 'bucket'], 'concrete'),
      R('sheeppen', 'زريبة الغنم', true, ['trough', 'hay', 'bucket'], 'sand'),
      R('camelpen', 'مربط الإبل', true, ['trough', 'saddle', 'hay'], 'sand'),
      R('workers', 'سكن العمّال', true, ['bed', 'chest', 'stool', 'fan'], 'wood'),
    ],
  },
  market: {
    key: 'market',
    titles: ['حادثة السوق', 'قبل الإغلاق بدقائق', 'سوق الذهب', 'ليلة الجرد', 'ممر العطّارين'],
    classes: { allowed: 'staff', forbidden: 'customer' },
    classNames: { staff: 'العاملون', customer: 'الزبائن' },
    rooms: [
      R('entrance', 'المدخل', false, ['sign', 'cart', 'plant', 'camera'], 'marble'),
      R('perfumes', 'محل العطور', false, ['display', 'counter', 'shelf', 'mirror'], 'marble'),
      R('gold', 'محل الذهب', false, ['display', 'counter', 'scale', 'camera'], 'marble'),
      R('abayas', 'محل العبايات', false, ['rack', 'mirror', 'counter', 'chair'], 'marble'),
      R('cafe', 'المقهى', false, ['table', 'chair', 'coffee', 'counter'], 'tile'),
      R('dates', 'محل التمور', false, ['scale', 'crate', 'counter', 'basket'], 'stone'),
      R('spices', 'محل البهارات', false, ['sack', 'scale', 'shelf', 'counter'], 'stone'),
      R('carpets', 'محل السجاد', false, ['carpet', 'rug', 'rack', 'chair'], 'rug'),
      R('corridor', 'الممر', false, ['bench', 'plant', 'sign', 'lamp'], 'marble'),
      R('prayer', 'المصلى', false, ['carpet', 'shelf', 'clock'], 'rug'),
      R('storage', 'المستودع', true, ['crate', 'shelf', 'cart', 'ladder'], 'concrete'),
      R('office', 'الإدارة', true, ['desk', 'chair', 'safe', 'camera'], 'wood'),
      R('cashroom', 'غرفة الصندوق', true, ['safe', 'register', 'desk', 'camera'], 'concrete'),
      R('cafekitchen', 'مطبخ المقهى', true, ['stove', 'sink', 'fridge', 'coffee'], 'tile'),
      R('loading', 'منصة التحميل', true, ['crate', 'cart', 'barrel', 'car'], 'concrete'),
      R('security', 'غرفة الأمن', true, ['camera', 'desk', 'chair', 'tv'], 'wood'),
      R('workshop', 'الورشة', true, ['desk', 'scale', 'shelf', 'lamp'], 'wood'),
      R('archive', 'الأرشيف', true, ['shelf', 'crate', 'desk'], 'wood'),
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
