// icons.js — رموز مؤقتة للأشياء (المرحلة 2). تُستبدل بلوحات المسار الفني المختار في المرحلة 3.
// عقد الراسم سطر واحد: «أعطني خلية، أرسم رمزًا». لا شيء في اللعبة يعرف مصدر الرمز.

export const OBJECT_ICONS = {
  table: '🍽️', chair: '🪑', carpet: '🧶', cushion: '🛋️', tv: '📺', sofa: '🛋️', lamp: '💡', dallah: '☕',
  tray: '🫖', stove: '🍳', fridge: '🧊', sink: '🚰', well: '🕳️', tree: '🌳', fountain: '⛲', palm: '🌴',
  car: '🚗', bed: '🛏️', wardrobe: '🚪', chest: '📦', shelf: '📚', desk: '🖥️', safe: '🔐', washer: '🫧',
  basket: '🧺', ladder: '🪜', sack: '🎒', barrel: '🛢️', bench: '🪑', plant: '🪴', mirror: '🪞', clock: '🕰️',
  trough: '🐄', saddle: '🐎', hay: '🌾', pump: '⚙️', tent: '⛺', fire: '🔥', cage: '🐔', crate: '📦',
  counter: '🧾', register: '💰', display: '💎', scale: '⚖️', coffee: '☕', camera: '📷', rack: '👗', cart: '🛒',
  sign: '🪧', bucket: '🪣', stool: '🪑', fan: '🌀', rug: '🧶',
};

export const iconFor = (key) => OBJECT_ICONS[key] ?? '▪️';
