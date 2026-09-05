// props.js — الأثاث والأشياء: رموز SVG بخط واحد متسق (حبر على ورق، من فوق).
//
// كل رمز في مربع 40×40، خط 2.2 بزوايا مدوّرة، تعبئة «ورق». الظل يُضاف بالـCSS (اتجاه ضوء واحد).
// في عرض المخطط تُرسم كخطوط فقط؛ في عرض المشهد بتعبئة ملوّنة خفيفة. الشكل واحد في الحالين.

const S = (paths, fill = '#ffffff') => ({ paths, fill });

// تعابير مختصرة لأشكال متكررة
const box = (x, y, w, h, r = 3) => `<rect x='${x}' y='${y}' width='${w}' height='${h}' rx='${r}'/>`;
const circ = (cx, cy, r) => `<circle cx='${cx}' cy='${cy}' r='${r}'/>`;
const line = (d) => `<path d='${d}'/>`;

export const PROPS = {
  table: S(`${box(6, 8, 28, 24, 4)}${line('M6 20 H34 M20 8 V32')}`, '#e9d7bf'),
  chair: S(`${box(10, 12, 20, 18, 3)}${line('M10 12 V6 H30 V12 M14 30 V35 M26 30 V35')}`, '#d9c3a3'),
  stool: S(`${circ(20, 20, 9)}${line('M12 26 L9 33 M28 26 L31 33')}`, '#d9c3a3'),
  bench: S(`${box(4, 14, 32, 12, 3)}${line('M8 26 V32 M32 26 V32 M4 20 H36')}`, '#d9c3a3'),
  sofa: S(`${box(4, 10, 32, 22, 6)}${box(9, 15, 22, 8, 2)}${line('M4 24 H36')}`, '#c9a28a'),
  cushion: S(`${box(8, 8, 24, 24, 8)}${line('M14 14 L26 26 M26 14 L14 26')}`, '#b8422f'),
  carpet: S(`${box(4, 6, 32, 28, 1)}${box(9, 11, 22, 18, 1)}${line('M4 12 H36 M4 28 H36')}`, '#b8422f'),
  rug: S(`${box(6, 4, 28, 32, 1)}${line('M6 10 H34 M6 30 H34 M20 10 V30')}`, '#b8422f'),
  tv: S(`${box(4, 8, 32, 20, 2)}${line('M16 34 H24 M20 28 V34')}`, '#3a3a3a'),
  lamp: S(`${line('M12 30 H28 L24 12 H16 Z M20 30 V36 M14 36 H26')}`, '#ffe2a8'),
  dallah: S(`${line('M14 32 H26 L28 16 L24 8 H16 L12 16 Z M28 18 L34 10 M12 20 L6 22 L8 28')}`, '#c9a24a'),
  tray: S(`${circ(20, 20, 14)}${circ(20, 20, 9)}${circ(14, 18, 2)}${circ(24, 22, 2)}`, '#c9a24a'),
  stove: S(`${box(6, 6, 28, 28, 2)}${circ(14, 14, 4)}${circ(26, 14, 4)}${circ(14, 26, 4)}${circ(26, 26, 4)}`, '#e8e2d3'),
  fridge: S(`${box(10, 4, 20, 32, 2)}${line('M10 16 H30 M26 8 V13 M26 20 V26')}`, '#eef0f2'),
  sink: S(`${box(6, 10, 28, 22, 4)}${circ(20, 21, 6)}${line('M20 10 V4 H26')}`, '#eef0f2'),
  well: S(`${circ(20, 20, 13)}${circ(20, 20, 7)}${line('M8 8 L12 12 M32 8 L28 12')}`, '#9aa4a8'),
  tree: S(`${circ(20, 16, 11)}${circ(12, 20, 6)}${circ(28, 20, 6)}${line('M20 26 V36')}`, '#7fa85a'),
  palm: S(`${line('M20 36 V20 M20 20 L8 12 M20 20 L32 12 M20 20 L6 22 M20 20 L34 22 M20 20 L14 8 M20 20 L26 8')}`, '#7fa85a'),
  fountain: S(`${circ(20, 20, 14)}${circ(20, 20, 6)}${line('M20 14 V6 M16 9 L20 6 L24 9')}`, '#9fc4d8'),
  plant: S(`${line('M14 34 H26 L28 24 H12 Z M20 24 V14 M20 18 L12 12 M20 16 L28 10')}`, '#7fa85a'),
  car: S(`${box(6, 12, 28, 18, 5)}${line('M10 12 L14 6 H26 L30 12 M6 22 H34')}${circ(12, 30, 3)}${circ(28, 30, 3)}`, '#8fa3b8'),
  bed: S(`${box(6, 4, 28, 32, 2)}${box(9, 7, 22, 8, 2)}${line('M6 18 H34')}`, '#e6d6f0'),
  wardrobe: S(`${box(8, 4, 24, 32, 2)}${line('M20 4 V36 M16 20 V24 M24 20 V24')}`, '#c99a63'),
  chest: S(`${box(6, 12, 28, 20, 3)}${line('M6 20 H34 M18 20 V26 H22 V20')}`, '#b07d4a'),
  crate: S(`${box(6, 8, 28, 24, 1)}${line('M6 8 L34 32 M34 8 L6 32')}`, '#c99a63'),
  shelf: S(`${box(6, 4, 28, 32, 1)}${line('M6 14 H34 M6 24 H34 M12 6 V12 M18 6 V12 M24 16 V22')}`, '#c99a63'),
  rack: S(`${line('M6 8 H34 M8 8 V36 M32 8 V36 M12 8 V24 M18 8 V26 M24 8 V24 M30 8 V26')}`, '#ffffff'),
  desk: S(`${box(4, 10, 32, 20, 2)}${line('M4 18 H36 M26 18 V30 M30 22 H34')}`, '#c99a63'),
  safe: S(`${box(8, 8, 24, 24, 2)}${circ(20, 20, 5)}${line('M20 15 V20 L23 22')}`, '#5f6b76'),
  register: S(`${box(6, 14, 28, 18, 2)}${line('M10 14 V8 H30 V14 M10 22 H30')}`, '#5f6b76'),
  washer: S(`${box(8, 6, 24, 28, 2)}${circ(20, 22, 7)}${line('M12 10 H18')}`, '#eef0f2'),
  basket: S(`${line('M8 14 H32 L29 34 H11 Z M12 14 Q20 4 28 14')}${line('M14 20 H26 M13 26 H27')}`, '#d8b86a'),
  bucket: S(`${line('M10 14 H30 L27 34 H13 Z M12 14 Q20 6 28 14')}`, '#9aa4a8'),
  sack: S(`${line('M12 34 H28 L30 16 Q20 10 10 16 Z M14 12 Q20 6 26 12')}`, '#d8b86a'),
  barrel: S(`${box(10, 6, 20, 28, 6)}${line('M10 14 H30 M10 26 H30')}`, '#b07d4a'),
  ladder: S(`${line('M12 4 V36 M28 4 V36 M12 10 H28 M12 18 H28 M12 26 H28 M12 34 H28')}`, '#c99a63'),
  mirror: S(`${box(10, 4, 20, 32, 10)}${line('M16 12 L14 20')}`, '#cfe3ec'),
  clock: S(`${circ(20, 20, 13)}${line('M20 11 V20 L26 24')}`, '#ffffff'),
  fan: S(`${circ(20, 20, 4)}${line('M20 16 Q28 6 32 14 Q24 16 20 16 M20 24 Q12 34 8 26 Q16 24 20 24 M16 20 Q6 12 14 8 Q16 16 16 20 M24 20 Q34 28 26 32 Q24 24 24 20')}`, '#eef0f2'),
  trough: S(`${box(4, 14, 32, 14, 3)}${line('M4 20 H36 M10 28 V33 M30 28 V33')}`, '#b07d4a'),
  saddle: S(`${line('M8 22 Q20 8 32 22 L28 30 H12 Z M20 12 V8')}`, '#b07d4a'),
  hay: S(`${line('M6 32 Q20 6 34 32 Z M14 32 L18 20 M26 32 L22 20')}`, '#d8b86a'),
  pump: S(`${box(12, 16, 16, 18, 2)}${line('M20 16 V8 H30 M20 8 L16 4')}${circ(20, 25, 4)}`, '#5f6b76'),
  tent: S(`${line('M4 32 L20 6 L36 32 Z M20 6 V32 M14 32 L18 22')}`, '#e9d7bf'),
  fire: S(`${line('M20 34 Q8 26 14 16 Q16 22 20 18 Q22 8 28 14 Q34 26 20 34 Z')}${circ(20, 27, 3)}`, '#f1a33c'),
  cage: S(`${box(8, 8, 24, 24, 3)}${line('M14 8 V32 M20 8 V32 M26 8 V32 M8 20 H32')}`, '#ffffff'),
  counter: S(`${box(4, 12, 32, 16, 2)}${line('M4 18 H36 M10 28 V34 M30 28 V34')}`, '#e9d7bf'),
  display: S(`${box(6, 8, 28, 24, 2)}${line('M6 16 H34 M6 24 H34')}${circ(14, 20, 2)}${circ(26, 20, 2)}`, '#cfe3ec'),
  scale: S(`${line('M20 8 V30 M8 12 H32 M8 12 L4 22 H12 Z M32 12 L28 22 H36 Z M12 30 H28')}`, '#c9a24a'),
  coffee: S(`${box(8, 6, 24, 28, 3)}${line('M8 16 H32 M16 24 H24 M20 16 V20')}`, '#3a3a3a'),
  camera: S(`${line('M8 14 H32 V30 H8 Z M14 14 L18 8 H22 L26 14')}${circ(20, 22, 5)}`, '#3a3a3a'),
  cart: S(`${box(8, 8, 24, 18, 2)}${line('M8 14 H32 M8 20 H32')}${circ(13, 32, 3)}${circ(27, 32, 3)}`, '#9aa4a8'),
  sign: S(`${box(6, 6, 28, 18, 2)}${line('M20 24 V36 M12 12 H28 M12 18 H22')}`, '#ffffff'),
};

/** ورقة رموز واحدة تُدرج في الصفحة مرة، ثم تُستدعى بـ<use href='#prop-key'>. */
export function propSymbolSheet() {
  const symbols = Object.entries(PROPS).map(([key, { paths, fill }]) =>
    `<symbol id='prop-${key}' viewBox='0 0 40 40'><g class='prop-ink' data-fill='${fill}' fill='var(--prop-fill, ${fill})' stroke='var(--prop-ink, #2a251f)' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'>${paths}</g></symbol>`);
  return `<svg xmlns='http://www.w3.org/2000/svg' style='position:absolute;width:0;height:0;overflow:hidden' aria-hidden='true'>${symbols.join('')}</svg>`;
}

export const hasProp = (key) => key in PROPS;
