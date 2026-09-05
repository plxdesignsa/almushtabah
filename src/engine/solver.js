// solver.js — الواجهة العليا للمحرّك: يحلّ القضية، يستخرج القاتل، يقيس الصعوبة،
// ويتحقق من ضرورة كل دليل (معايير القبول، القسم 13).

import { deriveKiller, evaluatePlacement } from './evaluate.js';
import { RULE_SETS, propagate } from './propagate.js';
import { Scene } from './scene.js';

export const TIERS = ['easy', 'medium', 'hard', 'expert'];
const GLOBAL_STEP_RULES = new Set(['occupancy', 'noEmptyRegion', 'regionQuota', 'pairwiseClass']);

/**
 * الصعوبة تُقاس لا تُقدَّر (القسم 06-C): درجة القضية هي أدنى مجموعة قواعد تكفي لحلها.
 *   easy    — حذف مباشر ووحيدات ظاهرة فقط.
 *   medium  — تحتاج وحيدات مخفية أو أدلة علائقية.
 *   hard    — تحتاج تفكير إشغال الغرف والقواعد العامة.
 *   expert  — hard + استنتاج عام متسلسل (خطوتان عامتان فأكثر) وسلسلة تلميحات تتجاوز ست خطوات.
 * يعيد null إن لم تُحل بكل القواعد.
 */
export function measureTier(scene) {
  for (const tier of ['easy', 'medium']) {
    const r = propagate(scene, { rules: RULE_SETS[tier] });
    if (r.ok && r.solved) return tier;
  }
  const r = propagate(scene, { rules: RULE_SETS.hard });
  if (!(r.ok && r.solved)) return null;
  return isExpertTrace(r.trace) ? 'expert' : 'hard';
}

/** خبير = استنتاج عام متسلسل (٣ خطوات إشغال/قواعد عامة فأكثر) وسلّم تلميحات من ٨ درجات فأكثر. */
export const EXPERT_MIN_GLOBAL_STEPS = 3;
export const EXPERT_MIN_LADDER = 8;
function isExpertTrace(trace) {
  const globalSteps = trace.filter((s) => GLOBAL_STEP_RULES.has(s.rule)).length;
  return globalSteps >= EXPERT_MIN_GLOBAL_STEPS && hintLadder(trace).length >= EXPERT_MIN_LADDER;
}

/** درجة تقريبية من أثر حلّ واحد (بلا إعادة تشغيل). للعرض السريع فقط؛ القياس الدقيق في measureTier. */
export function gradeDifficulty(rulesUsed, trace) {
  const used = (r) => (rulesUsed.get(r) ?? 0) > 0;
  const globalSteps = trace.filter((s) => GLOBAL_STEP_RULES.has(s.rule)).length;
  if (globalSteps > 0) return isExpertTrace(trace) ? 'expert' : 'hard';
  if (used('hiddenSingle') || used('relation')) return 'medium';
  return 'easy';
}

/**
 * الخطوات التي تستحق أن تُروى للاعب كتلميحات:
 *  - كل «حسم» (isolate) مهما كان سببه، لأن تثبيت شخصية حدث يستحق الذكر؛
 *  - وكل «حجب» ناتج عن استنتاج حقيقي (وحيد مخفي، علاقة، إشغال، قاعدة عامة).
 * قراءة البطاقة (unary) وحجب الصف والعمود (rowCol) ميكانيكية لا تُروى.
 */
const NARRATED_RULES = new Set(['hiddenSingle', 'relation', 'occupancy', 'noEmptyRegion', 'regionQuota', 'pairwiseClass']);
export function humanSteps(trace) {
  return trace.filter((s) => s.action === 'isolate' || NARRATED_RULES.has(s.rule));
}

/**
 * سلّم التلميحات (القسم 06-D): درجة لكل حسم غير ميكانيكي.
 * كل درجة تحمل: الشخصية المحسومة وسببها، الحجوبات الاستنتاجية التي مهّدت لها،
 * والحسومات التي تتابعت تلقائيًا بعدها بحجب الصف والعمود («وهذا يحسم بدوره…»).
 * الحجوبات المتتالية لنفس الشخصية وبنفس السبب تُدمج في سطر واحد.
 */
export function hintLadder(trace) {
  const ladder = [];
  let pending = [];
  const pushBlock = (s) => {
    const last = pending[pending.length - 1];
    if (last && last.char === s.char && last.because === s.because) last.cells = [...last.cells, ...s.cells];
    else pending.push({ char: s.char, cells: [...s.cells], because: s.because, rule: s.rule });
  };
  for (const s of trace) {
    if (s.action === 'isolate') {
      if (s.rule === 'rowCol' && ladder.length) {
        ladder[ladder.length - 1].cascade.push({ char: s.char, cell: s.cell, because: s.because });
        continue;
      }
      ladder.push({ step: ladder.length + 1, char: s.char, cell: s.cell, because: s.because, rule: s.rule, blocks: pending, cascade: [] });
      pending = [];
    } else if (NARRATED_RULES.has(s.rule)) {
      pushBlock(s);
    }
  }
  return ladder;
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
    tier: result.solved ? measureTier(scene) : null,
    contradiction: result.contradiction ?? null,
    scene,
  };
}

/**
 * يفحص ضرورة كل دليل: يعيد الحل بدونه ويرى هل يبقى قابلًا للحل.
 * الدليل «زائد» إن بقيت القضية محلولة بدونه. (معيار القبول: كل دليل ضروري.)
 * @param {Scene} scene
 * @param {{rules?: Set<string>}} [options]  قواعد المستنتج أثناء الفحص (الافتراضي: كلها)
 * @returns {{necessary:number[], redundant:number[]}}
 */
export function checkClueNecessity(scene, options = {}) {
  const necessary = [];
  const redundant = [];
  for (const clue of scene.clues) {
    if (clue.implicit) continue; // بطاقة الضحية جزء من القواعد لا من الأدلة القابلة للحذف
    const trimmed = withoutClue(scene, clue.index);
    const r = propagate(trimmed, options);
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
 * @param {{rules?: Set<string>}} [options]  القواعد المسموح للمستنتج استخدامها أثناء التقليم؛
 *   تقييدها يضمن أن القضية الناتجة تُحل بتلك القواعد وحدها (وسيلة استهداف الدرجة).
 * @returns {{kept:number[], dropped:number[]}}
 */
export function minimizeClues(scene, order, options = {}) {
  const explicit = scene.clues.filter((c) => !c.implicit).map((c) => c.index);
  const tryOrder = order ?? explicit;
  let current = scene.clues;
  const dropped = [];
  for (const index of tryOrder) {
    const trial = current.filter((c) => c.index !== index);
    const r = propagate(withClues(scene, trial), options);
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
    // الضرورة تُقاس بقواعد درجة القضية نفسها: لاعب المستوى السهل لا يُفترض أن يستعمل قواعد الخبير.
    const rules = RULE_SETS[r.tier === 'expert' ? 'hard' : r.tier];
    const { redundant } = checkClueNecessity(scene, { rules });
    if (redundant.length) issues.push({ code: 'redundantClues', detail: redundant });
  }

  return { ok: issues.length === 0, issues, result: r };
}
