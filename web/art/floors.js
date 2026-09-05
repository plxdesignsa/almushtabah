// floors.js — بلاطات الأرضيات (المسار B: مرسومة برمجيًا بـSVG).
//
// القاعدة الواحدة التي تصنع التماسك (القسم 07): زاوية نظر واحدة (من فوق)، واتجاه ضوء واحد
// (من الشمال الغربي، أعلى اليسار). كل نمط له ٣ صيغ لكسر التكرار المرئي، وتُختار بالخلية.
// الناتج data URI جاهز لـ background-image. اللون الأساسي يتبع «درجة الإضاءة» بمتغيرات CSS.

const enc = (svg) => `url("data:image/svg+xml,${encodeURIComponent(svg).replace(/%20/g, ' ')}")`;
const svg = (body, size = 40) => `<svg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}' viewBox='0 0 ${size} ${size}'>${body}</svg>`;

/** لوحة ألوان كل أرضية: القاعدة، الخط الغامق، والخط الفاتح (الضوء). */
// الألوان الأساسية من لوحة كلود ديزاين المحسّنة: تشبّع منخفض وإضاءة محصورة (L ≈ ٠٫٨٤–٠٫٩٢)
// ما عدا السجّاد (L ≈ ٠٫٦٨)، حتى تبقى ✗ والقلم مقروءة فوق كل خامة. النقوش مرسومة كما هي.
export const FLOOR_PALETTE = {
  rug: { base: '#bf8272', dark: '#9a5e4e', light: '#dcaa9a', ar: 'سجّاد' },
  tile: { base: '#e4dccc', dark: '#c4baa7', light: '#f3eee3', ar: 'بلاط' },
  stone: { base: '#d8d1c2', dark: '#b3aa98', light: '#e9e4d8', ar: 'حجر' },
  sand: { base: '#e6d9bd', dark: '#cbbb98', light: '#f2e9d5', ar: 'رمل' },
  grass: { base: '#c1c9a4', dark: '#9aa47e', light: '#d6dcbf', ar: 'عشب' },
  water: { base: '#b9cbd2', dark: '#92aab4', light: '#dbe6ea', ar: 'ماء' },
  wood: { base: '#d3b48f', dark: '#b08f68', light: '#e6cdae', ar: 'خشب' },
  concrete: { base: '#d6d1c7', dark: '#b4ada1', light: '#e6e2da', ar: 'إسمنت' },
  hay: { base: '#dfd0a8', dark: '#bda981', light: '#ede2c4', ar: 'قش' },
  marble: { base: '#ece6da', dark: '#cfc7b8', light: '#faf7f1', ar: 'رخام' },
};

const V = (variant) => variant % 3;

const PATTERNS = {
  rug: (p, v) => svg(`<rect width='40' height='40' fill='${p.base}'/>
    <path d='M20 4 L36 20 L20 36 L4 20 Z' fill='none' stroke='${p.light}' stroke-width='1.5'/>
    <path d='M20 10 L30 20 L20 30 L10 20 Z' fill='${v === 1 ? p.dark : 'none'}' stroke='${p.dark}' stroke-width='1.2'/>
    <circle cx='20' cy='20' r='${v === 2 ? 3 : 2}' fill='${p.light}'/>
    <path d='M0 0 H40 M0 40 H40' stroke='${p.dark}' stroke-width='1' opacity='.5'/>`),
  tile: (p, v) => svg(`<rect width='40' height='40' fill='${p.base}'/>
    <path d='M0 20 H40 M20 0 V40' stroke='${p.dark}' stroke-width='1.2'/>
    <path d='M1 1 H19 M1 1 V19 M21 21 H39 M21 21 V39' stroke='${p.light}' stroke-width='1'/>
    ${v === 1 ? `<circle cx='10' cy='30' r='1' fill='${p.dark}' opacity='.4'/>` : ''}${v === 2 ? `<circle cx='31' cy='9' r='1.2' fill='${p.dark}' opacity='.35'/>` : ''}`),
  stone: (p, v) => svg(`<rect width='40' height='40' fill='${p.base}'/>
    <path d='${v === 0 ? 'M0 14 H16 V0 M16 14 H40 M24 14 V40 M0 30 H24' : v === 1 ? 'M0 10 H22 V26 H40 M22 26 V40 M0 28 H10 V40' : 'M12 0 V18 H0 M12 18 H40 M28 18 V40 M12 34 H28'}' fill='none' stroke='${p.dark}' stroke-width='1.6' stroke-linejoin='round'/>
    <path d='${v === 0 ? 'M1 1 H15 M25 15 H39' : v === 1 ? 'M1 1 H21 M23 27 H39' : 'M13 1 V17 M13 19 H27'}' stroke='${p.light}' stroke-width='1' opacity='.9'/>`),
  sand: (p, v) => svg(`<rect width='40' height='40' fill='${p.base}'/>
    <path d='M0 ${8 + v * 3} Q10 ${4 + v * 3} 20 ${8 + v * 3} T40 ${8 + v * 3} M0 ${26 + v * 2} Q10 ${22 + v * 2} 20 ${26 + v * 2} T40 ${26 + v * 2}' fill='none' stroke='${p.light}' stroke-width='1.3'/>
    <circle cx='${6 + v * 9}' cy='18' r='1' fill='${p.dark}'/><circle cx='${30 - v * 4}' cy='35' r='.9' fill='${p.dark}'/>`),
  grass: (p, v) => svg(`<rect width='40' height='40' fill='${p.base}'/>
    <path d='M6 34 l2 -8 M10 36 l3 -7 M22 30 l2 -9 M27 33 l3 -6 M34 20 l2 -7 M14 16 l2 -7 M${4 + v * 5} 22 l2 -6 M${30 - v * 6} 10 l2 -6' stroke='${p.dark}' stroke-width='1.4' stroke-linecap='round'/>
    <path d='M8 33 l1 -5 M24 29 l1 -6 M35 19 l1 -5' stroke='${p.light}' stroke-width='1' stroke-linecap='round'/>`),
  water: (p, v) => svg(`<rect width='40' height='40' fill='${p.base}'/>
    <path d='M0 ${10 + v * 4} Q8 ${6 + v * 4} 16 ${10 + v * 4} T32 ${10 + v * 4} T48 ${10 + v * 4} M0 ${26 + v * 3} Q8 ${22 + v * 3} 16 ${26 + v * 3} T32 ${26 + v * 3} T48 ${26 + v * 3}' fill='none' stroke='${p.light}' stroke-width='1.6'/>
    <path d='M0 ${18 + v * 2} Q8 ${14 + v * 2} 16 ${18 + v * 2} T32 ${18 + v * 2} T48 ${18 + v * 2}' fill='none' stroke='${p.dark}' stroke-width='1' opacity='.6'/>`),
  wood: (p, v) => svg(`<rect width='40' height='40' fill='${p.base}'/>
    <path d='M0 10 H40 M0 20 H40 M0 30 H40 M${12 + v * 8} 0 V10 M${28 - v * 6} 10 V20 M${8 + v * 10} 20 V30 M${24 + v * 5} 30 V40' stroke='${p.dark}' stroke-width='1.3'/>
    <path d='M2 4 H30 M4 14 H22 M6 24 H36 M2 34 H18' stroke='${p.light}' stroke-width='.8' opacity='.7'/>
    <path d='M0 1 H40 M0 11 H40 M0 21 H40 M0 31 H40' stroke='${p.light}' stroke-width='.8' opacity='.9'/>`),
  concrete: (p, v) => svg(`<rect width='40' height='40' fill='${p.base}'/>
    <circle cx='${7 + v * 6}' cy='9' r='1' fill='${p.dark}' opacity='.5'/><circle cx='${29 - v * 3}' cy='22' r='.8' fill='${p.dark}' opacity='.5'/><circle cx='15' cy='${31 + v * 2}' r='1.1' fill='${p.dark}' opacity='.4'/><circle cx='34' cy='35' r='.7' fill='${p.light}'/>
    ${v === 2 ? `<path d='M4 36 L14 28' stroke='${p.dark}' stroke-width='.8' opacity='.35'/>` : ''}`),
  hay: (p, v) => svg(`<rect width='40' height='40' fill='${p.base}'/>
    <path d='M2 ${30 + v} l14 -9 M6 36 l18 -7 M20 ${12 + v * 2} l16 -6 M14 22 l20 -4 M0 ${14 - v * 3} l12 2 M26 30 l12 5' stroke='${p.dark}' stroke-width='1.2' stroke-linecap='round'/>
    <path d='M4 30 l12 -8 M22 12 l14 -5' stroke='${p.light}' stroke-width='.9' stroke-linecap='round'/>`),
  marble: (p, v) => svg(`<rect width='40' height='40' fill='${p.base}'/>
    <path d='M0 ${8 + v * 6} C 10 ${2 + v * 6}, 18 ${18 + v * 4}, 40 ${12 + v * 3} M${4 + v * 6} 40 C 12 30, 24 34, 34 22' fill='none' stroke='${p.dark}' stroke-width='.9' opacity='.6'/>
    <path d='M0 0 H40 V40' fill='none' stroke='${p.light}' stroke-width='1.5'/>`),
};

const cache = new Map();

/** خلفية CSS لخلية: نوع الأرضية + صيغة (لكسر التكرار). */
export function floorBackground(floor, variant = 0) {
  const key = `${floor}:${V(variant)}`;
  if (cache.has(key)) return cache.get(key);
  const p = FLOOR_PALETTE[floor] ?? FLOOR_PALETTE.tile;
  const draw = PATTERNS[floor] ?? PATTERNS.tile;
  const css = enc(draw(p, V(variant)));
  cache.set(key, css);
  return css;
}

/** نوع الأرضية لغرفة: من الملف، أو افتراض حسب التقييد. */
export const floorOf = (room) => room.floor ?? (room.restricted ? 'concrete' : 'tile');
