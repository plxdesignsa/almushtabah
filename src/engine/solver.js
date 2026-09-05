// solver.js — الواجهة العليا للمحرّك: يحلّ القضية، يستخرج القاتل، يقيس الصعوبة،
// ويتحقق من ضرورة كل دليل (معايير القبول، القسم 13).

import { deriveKiller, evaluatePlacement } from './evaluate.js';
import { propagate } from './propagate.js';
import { Scene } from './scene.js';

/** درجات الصعوبة حسب القواعد التي احتاجها الاستنتاج (القسم 06-C). */
const TIER_OF_RULE = {
  blocked: 'easy',
  unary: 'easy',
  rowCol: 'easy',
  hiddenSingle: 'medium',
  relation: 'medium',
  occupancy: 'hard',
  regionQuota: 'hard',
  noEmptyRegion: 'hard',
  pairwiseClass: 'hard',
  classRestriction: 'easy', // تُطبَّق مرة واحدة عند التهيئة؛ أثرها الحقيقي يظهر عبر القواعد الأخرى
};
const TIER_ORDER = ['easy', 'medium', 'hard', 'expert'];

export function gradeDifficulty(rulesUsed, trace) {
  let tier = 'easy';
  for (const rule of rulesUsed.keys()) {
    const t = TIER_OF_RULE[rule] ?? 'medium';
    if (TIER_ORDER.indexOf(t) > TIER_ORDER.indexOf(tier)) tier = t;
  }
  // خبير: استنتاج متسلسل يمرّ بقواعد عامة/إشغال، وسلسلة الخطوات الجوهرية تتجاوز ستًّا.
  const chainedGlobal = (rulesUsed.get('noEmptyRegion') ?? 0) + (rulesUsed.get('occupancy') ?? 0) +
    (rulesUsed.get('regionQuota') ?? 0) + (rulesUsed.get('pairwiseClass') ?? 0);
  if (tier === 'hard' && chainedGlobal >= 2 && humanSteps(trace).length > 6) tier = 'expert';
  return tier;
}

/** الخطوات التي تستحق أن تُروى للاعب: كل ما ليس نتيجة ميكانيكية لحسم سابق. */
export function humanSteps(trace) {
  return trace.filter((s) => s.rule !== 'rowCol' && s.rule !== 'blocked');
}

/**
 * @param {Scene|object} caseOrScene
 * @returns {SolveResult}
 */
export function solve(caseOrScene) {
  const scene = caseOrScene instanceof Scene ? caseOrScene : new Scene(caseOrScene);
  const result = propagate(scene);

  const placement = result.solved ? result.domains.map((d) => d.fixed) : null;
  const unpinned = result.domains
    .map((d, id) => ({ char: id, remaining: d.size }))
    .filter((x) => x.remaining !== 1);

  let killer = null;
  let matchesSolution = null;
  let clueCheck = null;
  if (placement) {
    killer = deriveKiller(scene, placement);
    clueCheck = evaluatePlacement(scene, placement);
    if (scene.solution) matchesSolution = placement.every((cell, i) => cell === scene.solution[i]);
  }

  return {
    id: scene.id,
    ok: result.ok,
    solved: result.solved,
    placement,
    unpinned,
    killer,
    victim: scene.victim?.id ?? null,
    matchesSolution,
    clueCheck,
    trace: result.trace,
    hintChain: humanSteps(result.trace),
    rulesUsed: Object.fromEntries(result.rulesUsed),
    rounds: result.rounds,
    tier: result.solved ? gradeDifficulty(result.rulesUsed, result.trace) : null,
    contradiction: result.contradiction ?? null,
    scene,
  };
}

/**
 * يفحص ضرورة كل دليل: يعيد الحل بدونه ويرى هل يبقى قابلًا للحل.
 * الدليل «زائد» إن بقيت القضية محلولة بدونه. (معيار القبول: كل دليل ضروري.)
 * @param {Scene} scene
 * @returns {{necessary:number[], redundant:number[]}}
 */
export function checkClueNecessity(scene) {
  const necessary = [];
  const redundant = [];
  for (const clue of scene.clues) {
    if (clue.implicit) continue; // بطاقة الضحية جزء من القواعد لا من الأدلة القابلة للحذف
    const trimmed = withoutClue(scene, clue.index);
    const r = propagate(trimmed);
    (r.ok && r.solved ? redundant : necessary).push(clue.index);
  }
  return { necessary, redundant };
}

/** نسخة من المشهد بلا دليل معيّن (تحافظ على فهارس الأدلة الأصلية في الأثر). */
export function withoutClue(scene, index) {
  return withClues(scene, scene.clues.filter((c) => c.index !== index));
}

/** نسخة خفيفة من المشهد بمجموعة أدلة مختلفة. */
export function withClues(scene, clues) {
  const clone = Object.create(Scene.prototype);
  Object.assign(clone, scene);
  clone.clues = clues;
  return clone;
}

/**
 * التقليم: نفس قلب المولّد (القسم 06-B) — يحذف الأدلة واحدًا واحدًا ما دام
 * الاستنتاج يحلّ بدونها. كل ما يبقى ضروري. الترتيب يحدد أي الأدلة تُضحّى أولًا.
 * @param {Scene} scene
 * @param {number[]} [order]  فهارس الأدلة بترتيب محاولة الحذف (الافتراضي: ترتيب الملف)
 * @returns {{kept:number[], dropped:number[]}}
 */
export function minimizeClues(scene, order) {
  const explicit = scene.clues.filter((c) => !c.implicit).map((c) => c.index);
  const tryOrder = order ?? explicit;
  let current = scene.clues;
  const dropped = [];
  for (const index of tryOrder) {
    const trial = current.filter((c) => c.index !== index);
    const r = propagate(withClues(scene, trial));
    if (r.ok && r.solved) {
      current = trial;
      dropped.push(index);
    }
  }
  return { kept: current.filter((c) => !c.implicit).map((c) => c.index), dropped };
}

/**
 * التحقق الكامل من قضية قبل نشرها (معايير القبول، القسم 13). يعيد قائمة المخالفات.
 * @param {Scene} scene
 */
export function acceptanceReport(scene) {
  const issues = [];
  const r = solve(scene);

  if (!r.ok) issues.push({ code: 'contradiction', detail: r.contradiction });
  else if (!r.solved) issues.push({ code: 'unsolved', detail: r.unpinned });

  if (scene.solution) {
    const ev = evaluatePlacement(scene, scene.solution);
    if (!ev.ok) issues.push({ code: 'solutionViolatesClues', detail: ev.failures });
    if (r.solved && r.matchesSolution === false) issues.push({ code: 'solutionMismatch' });
  }

  if (!scene.victim) issues.push({ code: 'noVictim' });
  else if (r.solved && r.killer === null) issues.push({ code: 'killerAmbiguous' });

  if (r.ok && r.solved) {
    const { redundant } = checkClueNecessity(scene);
    if (redundant.length) issues.push({ code: 'redundantClues', detail: redundant });
  }

  return { ok: issues.length === 0, issues, result: r };
}
