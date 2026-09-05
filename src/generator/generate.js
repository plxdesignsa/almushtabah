// generate.js — المولّد (القسم 06-B): ابدأ كاملًا ثم احذف.
//
//   1. تخطيط عشوائي (غرف، أشياء، خلايا محجوبة) من بيئة عربية.
//   2. شخصيات بصنفين، وحلّ عشوائي يحترم القواعد العامة وشرط الضحية.
//   3. كل الأدلة الصادقة ⇒ محلولة بالبناء (يُتحقق منها).
//   4. تقليم بترتيب موزون حسب الدرجة، والمستنتج مقيّد بقواعد الدرجة المستهدفة
//      حتى تكون القضية الناتجة قابلة للحل بتلك القواعد وحدها.
//   5. قياس الدرجة الفعلية، تسجيل سلسلة التلميحات، وتقييم جودة القضية.
//   يكرَّر ذلك عدة محاولات ويُختار الأفضل.

import { createRng } from '../engine/random.js';
import { evaluatePlacement } from '../engine/evaluate.js';
import { RULE_SETS, propagate } from '../engine/propagate.js';
import { Scene } from '../engine/scene.js';
import { measureTier, minimizeClues, withClues } from '../engine/solver.js';
import { buildCluePool, removalOrder } from './clue-pool.js';
import { NAMES, THEMES, THEME_KEYS } from './content.js';
import { PERSONA_KEYS } from './voice.js';
import { defaultRoomCount, generateLayout } from './layout.js';
import { randomPlacement } from './placement.js';
import { assembleCase, buildOverlay, hintChainFrom, hintLadderFrom } from './serialize.js';

const TIER_RULES = { easy: RULE_SETS.easy, medium: RULE_SETS.medium, hard: RULE_SETS.hard, expert: RULE_SETS.hard };
const TIER_RANK = { easy: 0, medium: 1, hard: 2, expert: 3 };

/**
 * @param {object} opts
 * @param {number} opts.size
 * @param {'easy'|'medium'|'hard'|'expert'} [opts.tier='hard']
 * @param {number|string} [opts.seed]
 * @param {string} [opts.theme]  house | farm | market (عشوائي إن لم يُحدَّد)
 * @param {string} [opts.id]
 * @param {number} [opts.attempts=10]
 * @param {number} [opts.maxPerChar=3]  أقصى أدلة لشخصية واحدة (بطاقة + سطر ثانٍ + ثالث)
 * @returns {{case:object, overlay:object, report:object}}
 */
export function generateCase(opts) {
  const size = opts.size;
  const tier = opts.tier ?? 'hard';
  const seed = opts.seed ?? Math.floor(Math.random() * 2 ** 31);
  const attempts = opts.attempts ?? 10;
  const maxPerChar = opts.maxPerChar ?? 3;
  const master = createRng(seed);
  const themeKey = opts.theme ?? THEME_KEYS[master.int(THEME_KEYS.length)];
  const theme = THEMES[themeKey];
  if (!theme) throw new Error(`بيئة غير معروفة: ${themeKey}`);
  const id = opts.id ?? `case-${String(seed).padStart(6, '0')}`;

  let best = null;
  const log = [];
  for (let attempt = 0; attempt < attempts; attempt++) {
    const rng = master.fork();
    const t0 = Date.now();
    const candidate = attemptOnce(rng, { size, tier, theme, id, maxPerChar, roomCount: opts.roomCount, blockedCount: opts.blockedCount });
    const ms = Date.now() - t0;
    if (!candidate) { log.push({ attempt, ms, ok: false }); continue; }
    log.push({ attempt, ms, ok: true, tier: candidate.tier, clues: candidate.clueCount, maxPerChar: candidate.maxPerChar, score: candidate.score });
    if (!best || candidate.score > best.score) best = candidate;
    if (candidate.tier === tier && candidate.maxPerChar <= 2 && candidate.silent <= 1) break; // جيد بما يكفي
  }
  if (!best) throw new Error(`فشل توليد قضية ${size}×${size} (${tier}) بعد ${attempts} محاولات — بذرة ${seed}`);

  const hintChain = hintChainFrom(best.trace);
  const caseJson = assembleCase({
    id, size, layout: best.layout, characters: best.characters, placement: best.placement,
    globalRules: best.globalRules, clues: best.clues, difficulty: best.tier, hintChain, hintLadder: hintLadderFrom(best.trace),
    meta: { seed, theme: themeKey, targetTier: tier, generator: 'almushtabah-gen/0.1', generatedAt: new Date().toISOString(), stats: best.stats },
  });
  const overlay = buildOverlay(best.scene, theme, { title: theme.titles[master.int(theme.titles.length)], characters: best.characters, trace: best.trace, rng: master.fork() });
  return { case: caseJson, overlay, report: { seed, theme: themeKey, targetTier: tier, tier: best.tier, attempts: log, stats: best.stats } };
}

function attemptOnce(rng, { size, tier, theme, id, maxPerChar, roomCount, blockedCount }) {
  const rooms = roomCount ?? defaultRoomCount(size);
  const blocked = blockedCount ?? (size >= 10 ? rng.int(3) : 0);
  const layout = generateLayout(rng, theme, { size, roomCount: rooms, blockedCount: blocked });

  const characters = makeCharacters(rng, theme, size);
  const roles = randomPlacement(rng, layout, characters.map((c) => ({ id: c.id, allowedInRestricted: c.class === theme.classes.allowed })));
  if (!roles) return null;
  const { placement, victim, killer } = roles;
  characters.forEach((c) => { c.victim = c.id === victim; });

  const globalRules = [
    { type: 'classRestriction', class: theme.classes.forbidden, forbidRestricted: true },
    { type: 'noEmptyRegion', scope: 'restricted' },
  ];
  // قاعدة حصة أحيانًا لدرجة الخبير: «كان في الساحة ثلاثة بالضبط».
  if (tier === 'expert' && size >= 8 && rng.chance(0.6)) {
    const counts = new Map();
    placement.forEach((cell) => counts.set(layout.roomMap[cell], (counts.get(layout.roomMap[cell]) ?? 0) + 1));
    const candidates = layout.rooms.filter((r) => !r.restricted && (counts.get(r.id) ?? 0) >= 2);
    if (candidates.length) {
      const r = rng.pick(candidates);
      globalRules.push({ type: 'regionQuota', room: r.key, count: counts.get(r.id) });
    }
  }

  const base = assembleCase({ id, size, layout, characters, placement, globalRules, clues: [] });
  const emptyScene = new Scene(base);
  const pool = buildCluePool(rng, emptyScene, placement, { victim, killer });
  const fullScene = completePool(rng, base, pool, placement, TIER_RULES[tier]);
  if (!fullScene) return null; // نادر: تعذّر إكمال المجمّع بقواعد الدرجة

  const truth = evaluatePlacement(fullScene, placement);
  if (!truth.ok) throw new Error('خلل داخلي: دليل كاذب في المجمّع ' + JSON.stringify(truth.failures));

  const order = removalOrder(rng, fullScene.clues, tier);
  const { kept } = minimizeClues(fullScene, order, { rules: TIER_RULES[tier] });
  const keptSet = new Set(kept);
  const finalClues = fullScene.clues.filter((c) => keptSet.has(c.index) || c.type === 'aloneWithKiller');
  const scene = withClues(fullScene, finalClues.map((c, i) => ({ ...c, index: i })));

  const measured = measureTier(scene);
  if (!measured) return null;
  const solved = propagate(scene);
  const perChar = new Map();
  scene.clues.filter((c) => c.type !== 'aloneWithKiller').forEach((c) => perChar.set(c.char, (perChar.get(c.char) ?? 0) + 1));
  const maxPer = Math.max(0, ...perChar.values());
  const silent = characters.filter((c) => !c.victim && !perChar.has(c.id)).length;
  const clueCount = scene.clues.length - 1;

  const stats = { clues: clueCount, maxPerChar: maxPer, silentCharacters: silent, hintSteps: hintLadderFrom(solved.trace).length, deductions: hintChainFrom(solved.trace).length, rooms: layout.rooms.length, rounds: solved.rounds };
  const score = scoreCandidate({ tier, measured, maxPer, maxPerChar, silent, size, clueCount });
  return {
    layout, characters, placement, globalRules, scene, trace: solved.trace,
    clues: scene.clues.map((c) => ({ char: c.char, type: c.type, room: c.room !== undefined ? scene.rooms[c.room].key : undefined, object: c.object, other: c.other, n: c.n, count: c.count })),
    tier: measured, clueCount, maxPerChar: maxPer, silent, stats, score,
  };
}

/**
 * إكمال المجمّع: المجمّع بلا أدلة إحداثية قد لا يميّز خليتين متجاورتين في غرفة واحدة.
 * لكل شخصية بقيت غير محسومة نضيف، بالترتيب: (١) «عند شيء» إن كانت فوق شيء، (٢) إزاحات
 * صف/عمود قصيرة عن شخصيات أخرى، (٣) وأخيرًا الصف أو العمود الرقمي. التقليم اللاحق يبقي
 * الأقل فقط، والأوزان تجعل الإحداثي أول ما يُحذف، فلا يبقى إلا حين لا بديل مشهدي له.
 * @returns {Scene|null}
 */
function completePool(rng, base, pool, placement, rules) {
  let clues = pool.map((c) => ({ ...c }));
  for (let round = 0; round < 4; round++) {
    const scene = new Scene({ ...base, clues });
    const r = propagate(scene, { rules });
    if (!r.ok) return null;
    if (r.solved) return scene;
    const unpinned = r.domains.map((d, id) => (d.size > 1 ? id : -1)).filter((id) => id >= 0);
    for (const id of unpinned) {
      if (id === scene.victim?.id) continue; // الضحية بلا بطاقات: تُحسم من الآخرين
      const p = placement[id];
      const has = (type, extra = {}) => clues.some((c) => c.char === id && c.type === type && Object.entries(extra).every(([k, v]) => c[k] === v));
      const onKey = scene.objects.find((o) => o.cell === p)?.key;
      if (round === 0 && onKey && !has('onObject', { object: onKey })) { clues.push({ char: id, type: 'onObject', object: onKey }); continue; }
      if (round <= 1) {
        const others = scene.characters.filter((o) => o.id !== id);
        const cands = [];
        for (const o of others) {
          const dr = scene.rowOf(p) - scene.rowOf(placement[o.id]);
          const dc = scene.colOf(p) - scene.colOf(placement[o.id]);
          if (Math.abs(dr) >= 1 && Math.abs(dr) <= 2 && !has('rowOffset', { other: o.id })) cands.push({ char: id, type: 'rowOffset', n: dr, other: o.id });
          if (Math.abs(dc) >= 1 && Math.abs(dc) <= 2 && !has('colOffset', { other: o.id })) cands.push({ char: id, type: 'colOffset', n: dc, other: o.id });
        }
        if (cands.length) { clues.push(...rng.sample(cands, Math.min(2, cands.length))); continue; }
      }
      if (!has('inRow')) clues.push({ char: id, type: 'inRow', n: scene.rowOf(p) + 1 });
      if (!has('inCol')) clues.push({ char: id, type: 'inCol', n: scene.colOf(p) + 1 });
    }
  }
  const scene = new Scene({ ...base, clues });
  const r = propagate(scene, { rules });
  return r.ok && r.solved ? scene : null;
}

/** جودة المرشّح: مطابقة الدرجة أولًا، ثم بطاقات متوازنة (≤2 لكل شخصية، لا شخصية صامتة)، ثم قلة الأدلة. */
function scoreCandidate({ tier, measured, maxPer, maxPerChar, silent, size, clueCount }) {
  let s = 0;
  s -= Math.abs(TIER_RANK[measured] - TIER_RANK[tier]) * 100;
  if (maxPer > maxPerChar) s -= (maxPer - maxPerChar) * 40;
  if (maxPer > 2) s -= 10;
  s -= silent * 8;
  s -= Math.max(0, clueCount - size * 1.6) * 2;
  return s;
}

function makeCharacters(rng, theme, size) {
  const keepers = Math.ceil(size / 2);
  const classes = rng.shuffle([...Array(size)].map((_, i) => (i < keepers ? theme.classes.allowed : theme.classes.forbidden)));
  const males = rng.shuffle([...NAMES.m]);
  const females = rng.shuffle([...NAMES.f]);
  return classes.map((cls, id) => {
    const gender = rng.chance(0.5) && females.length ? 'f' : 'm';
    const [key, ar] = gender === 'f' ? females.pop() : males.pop();
    return {
      id, key, ar, gender, class: cls, victim: false, voice: rng.pick(PERSONA_KEYS),
      avatar: { body: rng.between(1, 3), skin: rng.between(1, 5), hair: rng.between(1, 60), hairColor: rng.between(1, 4), facial: gender === 'm' ? rng.between(0, 8) : 0, clothes: rng.between(1, 8), clothesColor: rng.between(1, 12), hat: rng.between(0, 3) },
    };
  });
}
