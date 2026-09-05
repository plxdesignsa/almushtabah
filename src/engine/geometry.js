// geometry.js — حسابات الشبكة: فهرسة الخلايا، الصفوف والأعمدة، الجوار.
//
// الخلية تُمثَّل برقم واحد (row-major): cell = row * size + col.
// «بجانب» تعني: يمين/يسار/فوق/تحت مباشرة **وفي الغرفة نفسها**. القطر لا يُحتسب،
// والجوار لا يعبر جدار الغرفة (القسم 02 من المواصفات).

export const cellIndex = (row, col, size) => row * size + col;
export const rowOf = (cell, size) => Math.floor(cell / size);
export const colOf = (cell, size) => cell % size;
export const toRowCol = (cell, size) => [rowOf(cell, size), colOf(cell, size)];

/** الجيران الأربعة داخل حدود الشبكة (بدون اعتبار الغرف). */
export function orthogonalNeighbours(cell, size) {
  const r = rowOf(cell, size);
  const c = colOf(cell, size);
  const out = [];
  if (r > 0) out.push(cell - size);
  if (r < size - 1) out.push(cell + size);
  if (c > 0) out.push(cell - 1);
  if (c < size - 1) out.push(cell + 1);
  return out;
}

/** هل الخليتان متجاورتان تجاورًا مباشرًا وفي غرفة واحدة؟ */
export function isBeside(a, b, size, roomOfCell) {
  if (a === b) return false;
  if (roomOfCell[a] !== roomOfCell[b]) return false;
  const dr = Math.abs(rowOf(a, size) - rowOf(b, size));
  const dc = Math.abs(colOf(a, size) - colOf(b, size));
  return dr + dc === 1;
}

/** هل تتعارض الخليتان بقاعدة «واحد لكل صف وعمود»؟ */
export function sharesLine(a, b, size) {
  return rowOf(a, size) === rowOf(b, size) || colOf(a, size) === colOf(b, size);
}

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
const ar = (n) => String(n).replace(/\d/g, (d) => AR_DIGITS[d]);

/**
 * تنسيق بشري للخلية: ص٣ ع٥ (بترقيم يبدأ من ١).
 * اتفاق الخريطة العربية: الصفوف من الأعلى، والأعمدة من اليمين (العمود ١ أقصى اليمين).
 * فهرس العمود الداخلي (0 = الأول) يُعرض كما هو؛ الواجهة ترسم العمود 0 على اليمين.
 */
export function formatCell(cell, size) {
  return `ص${ar(rowOf(cell, size) + 1)} ع${ar(colOf(cell, size) + 1)}`;
}

/**
 * اتجاه الأعمدة على الخريطة: الشمال أعلى، والشرق يمين الشاشة. وبما أن العمود ١ يُرسم يمينًا،
 * فالإزاحة إلى فهرس أصغر تعني «شرقًا» والأكبر «غربًا».
 */
export const colDirectionWord = (n) => (n < 0 ? 'شرق' : 'غرب');
