// نقطة الدخول العامة للمحرّك.
export { Scene, sceneFromJSON, CaseFormatError } from './scene.js';
export { propagate, Contradiction, RULE_SETS } from './propagate.js';
export { solve, checkClueNecessity, acceptanceReport, gradeDifficulty, measureTier, humanSteps, hintLadder, withoutClue, withClues, minimizeClues, TIERS } from './solver.js';
export { createRng } from './random.js';
export { evaluatePlacement, deriveKiller } from './evaluate.js';
export { CLUE_TYPES, GLOBAL_RULE_TYPES } from './clues.js';
export { describeClue, describeStep, describeGlobalRule, describeRung } from './describe.js';
export * as geometry from './geometry.js';
