// describe.js — تحويل الأدلة وخطوات الأثر إلى جمل عربية محايدة.
//
// هذه صياغة «آلية» للتصحيح ولسلّم التلميحات، وليست النص الأدبي النهائي الذي
// يكتبه المؤلف في طبقة الترجمة (الخطوة 5 من خط الإنتاج). لكنها تضمن أن المعنى
// المطبوع يطابق الدليل الآلي حرفيًا. تُصرَّف الأفعال حسب حقل gender في الشخصية.

import { formatCell } from './geometry.js';

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export const arNum = (n) => String(n).replace(/\d/g, (d) => AR_DIGITS[d]);

/** صرف بسيط: يختار الصيغة المذكّرة أو المؤنّثة حسب الشخصية. */
function conj(scene, charId) {
  const f = scene.char(charId).gender === 'f';
  return {
    kan: f ? 'كانت' : 'كان',
    lamYakun: f ? 'لم تكن' : 'لم يكن',
    wahd: f ? 'وحدها' : 'وحده',
    huwa: f ? 'هي' : 'هو',
    minhum: f ? 'هي منهم' : 'هو منهم',
  };
}

const countWord = (k, one, two, many) => (k === 1 ? one : k === 2 ? two : `${arNum(k)} ${many}`);

/**
 * @param {import('./scene.js').Scene} scene
 * @param {object} [overlay]  طبقة الأسماء: { chars:{key:اسم}, rooms:{key:اسم}, objects:{key:اسم} }
 */
export function makeNamer(scene, overlay = {}) {
  return {
    char: (id) => overlay.chars?.[scene.char(id).key] ?? scene.char(id).key,
    room: (id) => overlay.rooms?.[scene.room(id).key] ?? scene.room(id).key,
    object: (key) => overlay.objects?.[key] ?? key,
    cell: (cell) => formatCell(cell, scene.size),
    cells: (cells) => cells.map((c) => formatCell(c, scene.size)).join('، '),
    /** قائمة مختصرة: تُعدَّد الخلايا القليلة، وتُلخَّص الكثيرة بصفوفها أو أعمدتها أو عددها. */
    cellsBrief: (cells) => {
      if (cells.length <= 6) return cells.map((c) => formatCell(c, scene.size)).join('، ');
      const rows = new Set(cells.map((c) => Math.floor(c / scene.size)));
      const cols = new Set(cells.map((c) => c % scene.size));
      if (rows.size <= 2) return `${rows.size === 1 ? 'الصف' : 'الصفين'} ${[...rows].map((r) => arNum(r + 1)).join(' و')}`;
      if (cols.size <= 2) return `${cols.size === 1 ? 'العمود' : 'العمودين'} ${[...cols].map((c) => arNum(c + 1)).join(' و')}`;
      return `${arNum(cells.length)} خلية`;
    },
  };
}

const female = (scene, id) => scene.char(id).gender === 'f';
const trimDot = (s) => s.replace(/[.\s]+$/, '');

export function describeClue(scene, clue, overlay) {
  const N = makeNamer(scene, overlay);
  const who = N.char(clue.char);
  const v = conj(scene, clue.char);
  switch (clue.type) {
    case 'inRoom': return `${who}: ${v.kan} في ${N.room(clue.room)}.`;
    case 'notInRoom': return `${who}: ${v.lamYakun} في ${N.room(clue.room)}.`;
    case 'onObject': return `${who}: ${v.kan} عند ${N.object(clue.object)}.`;
    case 'notOnObject': return `${who}: ${v.lamYakun} عند ${N.object(clue.object)}.`;
    case 'besideObject': return `${who}: ${v.kan} بجانب ${N.object(clue.object)}.`;
    case 'notBesideObject': return `${who}: ${v.lamYakun} بجانب ${N.object(clue.object)}.`;
    case 'inRow': return `${who}: ${v.kan} في الصف ${arNum(clue.n)}.`;
    case 'inCol': return `${who}: ${v.kan} في العمود ${arNum(clue.n)}.`;
    case 'besideChar': return `${who}: ${v.kan} بجانب ${N.char(clue.other)}.`;
    case 'sameRoom': return `${who}: ${v.kan} في غرفة ${N.char(clue.other)} نفسها.`;
    case 'diffRoom': return `${who}: ${v.lamYakun} في غرفة ${N.char(clue.other)}.`;
    case 'rowOffset': {
      const k = Math.abs(clue.n);
      const dir = clue.n < 0 ? 'شمال' : 'جنوب';
      return `${who}: ${v.kan} ${countWord(k, 'صفًّا واحدًا', 'صفّين', 'صفوف')} ${dir} ${N.char(clue.other)} بالضبط.`;
    }
    case 'colOffset': {
      // الخريطة شمالها فوق وشرقها يمين بغض النظر عن اتجاه اللغة؛ لذا الأعمدة بالشرق والغرب كالصفوف بالشمال والجنوب.
      const k = Math.abs(clue.n);
      const dir = clue.n < 0 ? 'غرب' : 'شرق';
      return `${who}: ${v.kan} ${countWord(k, 'عمودًا واحدًا', 'عمودين', 'أعمدة')} ${dir} ${N.char(clue.other)} بالضبط.`;
    }
    case 'aloneInRoom': return `${who}: ${v.kan} ${v.wahd} في الغرفة.`;
    case 'aloneWith': return `${who}: ${v.kan} ${v.wahd} مع ${N.char(clue.other)}.`;
    case 'aloneWithKiller': return `${who}: ${v.kan} ${v.wahd} مع القاتل.`;
    case 'roomOccupancy': return `${who}: ${v.kan} في غرفته ${arNum(clue.count)} أشخاص بالضبط (${v.minhum}).`;
    default: return `${who}: (${clue.type})`;
  }
}

export function describeGlobalRule(scene, rule, overlay) {
  const N = makeNamer(scene, overlay);
  const cls = (c) => overlay?.classes?.[c] ?? c;
  const rooms = (ids) => [...ids].map((r) => N.room(r)).join(' و');
  switch (rule.type) {
    case 'classRestriction':
      return `لا يدخل أحد من «${cls(rule.class)}» إلى: ${rooms(rule.forbiddenRooms)}.`;
    case 'noEmptyRegion':
      return `لا تُترك أي من هذه الغرف فارغة: ${rooms(rule.rooms)}.`;
    case 'regionQuota':
      return `${N.room(rule.room)} فيها ${arNum(rule.count)} أشخاص بالضبط.`;
    case 'pairwiseClass':
      return `لا يجتمع اثنان من «${cls(rule.class)}» في غرفة واحدة.`;
    default:
      return rule.type;
  }
}

/** سبب الخطوة بصيغة مقروءة. */
function describeReason(scene, step, overlay) {
  const N = makeNamer(scene, overlay);
  const m = /^(clues|globalRules)\[(\d+)\]$/.exec(step.because ?? '');
  if (m && m[1] === 'clues') {
    const clue = scene.clues.find((c) => c.index === Number(m[2]));
    return clue ? `الدليل ${arNum(clue.index + 1)}: ${describeClue(scene, clue, overlay)}` : step.because;
  }
  if (m && m[1] === 'globalRules') {
    const rule = scene.globalRules[Number(m[2])];
    return rule ? `القاعدة العامة ${arNum(rule.index + 1)}: ${describeGlobalRule(scene, rule, overlay)}` : step.because;
  }
  if (step.rule === 'rowCol') {
    const placed = Number(step.because.split(':')[1]);
    const female = scene.char(placed).gender === 'f';
    return `${N.char(placed)} ${female ? 'محسومة فتحجب صفها وعمودها' : 'محسوم فيحجب صفه وعموده'}`;
  }
  if (step.rule === 'hiddenSingle') {
    const [axis, k] = step.because.split(':');
    const female = scene.char(step.char).gender === 'f';
    return `لا أحد ${female ? 'غيرها' : 'غيره'} يمكنه شغل ${axis === 'row' ? 'الصف' : 'العمود'} ${arNum(k)}`;
  }
  if (step.rule === 'blocked') return 'خلية محجوبة';
  return step.because;
}

/** سبب مختصر للتلميحات: القواعد العامة برقمها فقط (نصّها معروض للاعب أصلًا)، والأدلة بنصّها. */
function shortReason(scene, step, overlay) {
  const m = /^globalRules\[(\d+)\]$/.exec(step.because ?? '');
  if (m) return `القاعدة العامة ${arNum(Number(m[1]) + 1)}`;
  return trimDot(describeReason(scene, step, overlay));
}

const RUNG_MAX_BLOCKS = 3;

/** درجة من سلّم التلميحات كفقرة عربية واحدة، مقتصرة على آخر الحجوبات التي مهّدت للحسم. */
export function describeRung(scene, rung, overlay) {
  const N = makeNamer(scene, overlay);
  const parts = [];
  const blocks = rung.blocks.slice(-RUNG_MAX_BLOCKS);
  const skipped = rung.blocks.length - blocks.length;
  if (skipped > 0) {
    const phrase = skipped === 1 ? 'استبعاد مباشر واحد' : skipped === 2 ? 'استبعادين مباشرين' : skipped <= 10 ? `${arNum(skipped)} استبعادات مباشرة` : `${arNum(skipped)} استبعادًا مباشرًا`;
    parts.push(`بعد ${phrase} من البطاقات والقواعد العامة:`);
  }
  for (const b of blocks) {
    parts.push(`استبعد ${N.char(b.char)} من ${N.cellsBrief(b.cells)} لأن ${shortReason(scene, b, overlay)}.`);
  }
  const f = female(scene, rung.char);
  parts.push(`${N.char(rung.char)} لا يمكن أن ${f ? 'تكون' : 'يكون'} إلا في ${N.cell(rung.cell)} لأن ${shortReason(scene, rung, overlay)}.`);
  if (rung.cascade.length) {
    parts.push(`وهذا يحسم بدوره: ${rung.cascade.map((c) => `${N.char(c.char)} في ${N.cell(c.cell)}`).join('، ')}.`);
  }
  return `${arNum(rung.step)}. ${parts.join(' ')}`;
}

export function describeStep(scene, step, overlay) {
  const N = makeNamer(scene, overlay);
  const who = N.char(step.char);
  const verb = step.action === 'isolate' ? 'حسم' : 'حجب';
  const what = step.action === 'isolate'
    ? `${who} لا يمكن أن ${female(scene, step.char) ? 'تكون' : 'يكون'} إلا في ${N.cell(step.cell)}`
    : `استبعد ${who} من ${countWord(step.cells.length, 'خلية واحدة', 'خليتين', 'خلايا')} (${N.cells(step.cells)})، بقي ${arNum(step.remaining)}`;
  return `${arNum(step.step)}. [${verb}] ${what} — ${trimDot(describeReason(scene, step, overlay))}`;
}
