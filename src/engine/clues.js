// clues.js — كتالوج الأدلة (القسم 03 من المواصفات).
//
// كل دليل «قابل للفحص آليًا»: له دالة `holds` تقرّر صدقه على أي توزيع كامل.
// وينتمي لأحد ثلاثة أصناف يعرف المستنتج كيف يستثمرها:
//   unary     — يخصّ شخصية واحدة ويُترجم مباشرة إلى مرشّح خلايا (cellPredicate).
//   binary    — علاقة بين شخصيتين (بجانب، نفس الغرفة، إزاحة صفوف…) تُعالج بمراجعة الدعم.
//   occupancy — عدد شاغلي غرفة الشخصية (وحده، وحده مع فلان، وحده مع القاتل).
//
// إضافات على الكتالوج الأصلي (مع الإبقاء على كل ما في المواصفات):
//   aloneWithKiller — بطاقة الضحية: «كان وحده مع القاتل» أي غرفته فيها اثنان بالضبط.
//   colOffset       — نظير rowOffset على الأعمدة (شرق/غرب) لتناظر الشبكة.
//   roomOccupancy   — تعميم: «كان معه في الغرفة k أشخاص» بأي عدد.

const room = (scene, cell) => scene.roomOfCell[cell];

/**
 * @typedef {Object} ClueDef
 * @property {'unary'|'binary'|'occupancy'} kind
 * @property {string[]} args  أسماء الحقول المطلوبة في JSON
 * @property {(scene, clue, placement:number[]) => boolean} holds
 * @property {(scene, clue) => (cell:number)=>boolean} [cellPredicate]  للأحادي
 * @property {(scene, clue, x:number, y:number) => boolean} [relation]  للثنائي: x خلية الشخصية، y خلية الأخرى
 * @property {(clue) => number} [count]  للإشغال
 */

/** @type {Record<string, ClueDef>} */
export const CLUE_TYPES = {
  // ---------- أحادية ----------
  inRoom: {
    kind: 'unary',
    args: ['room'],
    cellPredicate: (scene, clue) => (cell) => room(scene, cell) === clue.room,
    holds: (scene, clue, p) => room(scene, p[clue.char]) === clue.room,
  },
  notInRoom: {
    kind: 'unary',
    args: ['room'],
    cellPredicate: (scene, clue) => (cell) => room(scene, cell) !== clue.room,
    holds: (scene, clue, p) => room(scene, p[clue.char]) !== clue.room,
  },
  onObject: {
    kind: 'unary',
    args: ['object'],
    cellPredicate: (scene, clue) => (cell) => scene.objectCells(clue.object).has(cell),
    holds: (scene, clue, p) => scene.objectCells(clue.object).has(p[clue.char]),
  },
  notOnObject: {
    kind: 'unary',
    args: ['object'],
    cellPredicate: (scene, clue) => (cell) => !scene.objectCells(clue.object).has(cell),
    holds: (scene, clue, p) => !scene.objectCells(clue.object).has(p[clue.char]),
  },
  besideObject: {
    kind: 'unary',
    args: ['object'],
    cellPredicate: (scene, clue) => (cell) => scene.besideObjectCells(clue.object).has(cell),
    holds: (scene, clue, p) => scene.besideObjectCells(clue.object).has(p[clue.char]),
  },
  notBesideObject: {
    kind: 'unary',
    args: ['object'],
    cellPredicate: (scene, clue) => (cell) => !scene.besideObjectCells(clue.object).has(cell),
    holds: (scene, clue, p) => !scene.besideObjectCells(clue.object).has(p[clue.char]),
  },
  inRow: {
    kind: 'unary',
    args: ['n'], // رقم الصف، يبدأ من ١ كما يقرؤه اللاعب
    cellPredicate: (scene, clue) => (cell) => scene.rowOf(cell) === clue.n - 1,
    holds: (scene, clue, p) => scene.rowOf(p[clue.char]) === clue.n - 1,
  },
  inCol: {
    kind: 'unary',
    args: ['n'],
    cellPredicate: (scene, clue) => (cell) => scene.colOf(cell) === clue.n - 1,
    holds: (scene, clue, p) => scene.colOf(p[clue.char]) === clue.n - 1,
  },

  // ---------- ثنائية ----------
  besideChar: {
    kind: 'binary',
    args: ['other'],
    relation: (scene, _clue, x, y) => scene.isBeside(x, y),
    holds: (scene, clue, p) => scene.isBeside(p[clue.char], p[clue.other]),
  },
  sameRoom: {
    kind: 'binary',
    args: ['other'],
    relation: (scene, _clue, x, y) => room(scene, x) === room(scene, y),
    holds: (scene, clue, p) => room(scene, p[clue.char]) === room(scene, p[clue.other]),
  },
  diffRoom: {
    kind: 'binary',
    args: ['other'],
    relation: (scene, _clue, x, y) => room(scene, x) !== room(scene, y),
    holds: (scene, clue, p) => room(scene, p[clue.char]) !== room(scene, p[clue.other]),
  },
  rowOffset: {
    // صف الشخصية = صف الأخرى + n. (n سالب = شمالها، موجب = جنوبها)
    kind: 'binary',
    args: ['other', 'n'],
    relation: (scene, clue, x, y) => scene.rowOf(x) === scene.rowOf(y) + clue.n,
    holds: (scene, clue, p) => scene.rowOf(p[clue.char]) === scene.rowOf(p[clue.other]) + clue.n,
  },
  colOffset: {
    // عمود الشخصية = عمود الأخرى + n. (n سالب = غربها/يسارها، موجب = شرقها)
    kind: 'binary',
    args: ['other', 'n'],
    relation: (scene, clue, x, y) => scene.colOf(x) === scene.colOf(y) + clue.n,
    holds: (scene, clue, p) => scene.colOf(p[clue.char]) === scene.colOf(p[clue.other]) + clue.n,
  },

  // ---------- إشغال الغرفة ----------
  aloneInRoom: {
    kind: 'occupancy',
    args: [],
    count: () => 1,
    holds: (scene, clue, p) => roomCount(scene, p, room(scene, p[clue.char])) === 1,
  },
  aloneWith: {
    // = sameRoom(other) + غرفته فيها اثنان بالضبط. المُحمِّل يشتق منه العلاقة الثنائية.
    kind: 'occupancy',
    args: ['other'],
    count: () => 2,
    holds: (scene, clue, p) =>
      room(scene, p[clue.char]) === room(scene, p[clue.other]) &&
      roomCount(scene, p, room(scene, p[clue.char])) === 2,
  },
  aloneWithKiller: {
    // بطاقة الضحية. القاتل لا يُسأل عنه أبدًا؛ هو من ينتهي في غرفة الضحية.
    kind: 'occupancy',
    args: [],
    count: () => 2,
    holds: (scene, clue, p) => roomCount(scene, p, room(scene, p[clue.char])) === 2,
  },
  roomOccupancy: {
    kind: 'occupancy',
    args: ['count'],
    count: (clue) => clue.count,
    holds: (scene, clue, p) => roomCount(scene, p, room(scene, p[clue.char])) === clue.count,
  },
};

/** عدد الشخصيات في غرفة معيّنة ضمن توزيع كامل. */
export function roomCount(scene, placement, roomId) {
  let n = 0;
  for (const cell of placement) if (room(scene, cell) === roomId) n++;
  return n;
}

// ---------- القواعد العامة (القسم 04) ----------
// تُقيَّم على التوزيع الكامل هنا؛ أما استثمارها في الاستنتاج ففي propagate.js.
export const GLOBAL_RULE_TYPES = {
  classRestriction: {
    // شخصيات الصنف `class` لا تدخل الغرف المقيّدة (forbidRestricted) أو غرفًا مسمّاة (rooms).
    holds: (scene, rule, p) =>
      scene.characters.every(
        (ch) => ch.class !== rule.class || !rule.forbiddenRooms.has(room(scene, p[ch.id])),
      ),
  },
  noEmptyRegion: {
    holds: (scene, rule, p) => [...rule.rooms].every((r) => roomCount(scene, p, r) >= 1),
  },
  regionQuota: {
    holds: (scene, rule, p) => roomCount(scene, p, rule.room) === rule.count,
  },
  pairwiseClass: {
    holds: (scene, rule, p) => {
      const seen = new Set();
      for (const ch of scene.characters) {
        if (ch.class !== rule.class) continue;
        const r = room(scene, p[ch.id]);
        if (seen.has(r)) return false;
        seen.add(r);
      }
      return true;
    },
  },
};
