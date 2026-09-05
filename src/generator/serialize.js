// serialize.js — تجميع ملف القضية الرئيسي (القسم 05) وطبقة الترجمة العربية.

import { describeClue, describeRung } from '../engine/describe.js';
import { hintLadder, humanSteps, withClues } from '../engine/solver.js';
import { OBJECTS } from './content.js';
import { voiceClues } from './voice.js';

/** يبني كائن القضية (JSON) من مكوّنات المولّد. */
export function assembleCase({ id, size, layout, characters, placement, globalRules, clues, difficulty, hintChain, hintLadder: ladder, mode, meta }) {
  return {
    id,
    size,
    difficulty: difficulty ?? null,
    mode: mode ?? 'classic',
    blockedCells: layout.blockedCells.map((c) => [Math.floor(c / size), c % size]),
    roomMap: layout.roomMap,
    rooms: layout.rooms.map((r) => ({ id: r.id, key: r.key, restricted: r.restricted, floor: r.floor ?? (r.restricted ? 'concrete' : 'tile') })),
    objects: layout.objects.map((o) => ({ cell: [Math.floor(o.cell / size), o.cell % size], key: o.key, sprite: o.sprite, variant: o.variant })),
    characters: characters.map((c) => ({ id: c.id, key: c.key, gender: c.gender, class: c.class, victim: c.victim, voice: c.voice, avatar: c.avatar })),
    solution: placement.map((cell) => [Math.floor(cell / size), cell % size]),
    globalRules,
    clues: clues.map((c) => serializeClue(c, characters)),
    hintChain: hintChain ?? [],
    hintLadder: ladder ?? [],
    meta: meta ?? {},
  };
}

function serializeClue(c, characters) {
  const out = { char: characters[c.char].key, type: c.type };
  if (c.room !== undefined) out.room = c.room;
  if (c.object !== undefined) out.object = c.object;
  if (c.other !== undefined) out.other = characters[c.other].key;
  if (c.n !== undefined) out.n = c.n;
  if (c.count !== undefined) out.count = c.count;
  if (c.lie) out.lie = true;
  return out;
}

/** سلسلة التلميحات من أثر الحل، بصيغة القسم 05 (block / isolate). */
export function hintChainFrom(trace) {
  return humanSteps(trace).map((s, i) => ({
    step: i + 1,
    action: s.action,
    char: s.char,
    ...(s.action === 'isolate' ? { cell: s.cell } : { cells: s.cells }),
    because: s.because,
    rule: s.rule,
  }));
}

/**
 * طبقة الترجمة: أسماء + بطاقات الشهود بصوتهم (باللهجة) + الصياغة الآلية المحايدة للمراجعة
 * + سلّم التلميحات. المعنى في البطاقة يطابق الدليل الآلي حرفيًا؛ الصوت فقط يختلف.
 */
export function buildOverlay(scene, theme, { title, characters, trace, rng }) {
  const overlay = {
    title,
    rooms: Object.fromEntries(scene.rooms.map((r) => [r.key, theme.rooms.find((t) => t.key === r.key)?.ar ?? r.key])),
    objects: Object.fromEntries([...new Set(scene.objects.map((o) => o.key))].map((k) => [k, OBJECTS[k] ?? k])),
    chars: Object.fromEntries(characters.map((c) => [c.key, c.ar])),
    classes: theme.classNames,
  };
  const voiced = voiceClues(scene, overlay, rng);
  overlay.clues = voiced.clues;
  overlay.cards = voiced.cards;
  overlay.victimCard = voiced.victimCard;
  overlay.machineClues = Object.fromEntries(scene.clues.map((c) => [String(c.index), describeClue(scene, c, overlay)]));
  // التلميحات تُبنى على البطاقات الصادقة؛ في نمط الشاهد الكاذب تبدأ بدرجة تشرح المبدأ بلا كشف الكاذب.
  const truthScene = scene.liar === null ? scene : withClues(scene, scene.truthfulClues);
  const rungs = hintLadder(trace).map((r) => [String(r.step), describeRung(truthScene, r, overlay)]);
  overlay.hints = Object.fromEntries(rungs);
  if (scene.liar !== null) overlay.lyingIntro = 'أحد الشهود يكذب، وهو القاتل. صدّق الجميع أولًا وستصل إلى تناقض؛ البطاقة التي إذا استبعدتها زال التناقض وانحلّت القضية هي بطاقة القاتل.';
  return overlay;
}

/** سلّم التلميحات بصيغة قابلة للتخزين (بلا دوال). */
export function hintLadderFrom(trace) {
  return hintLadder(trace);
}
