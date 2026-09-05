// نقطة الدخول العامة للمحرّك.
export { Scene, sceneFromJSON, CaseFormatError } from './scene.js';
export { propagate, Contradiction } from './propagate.js';
export { solve, checkClueNecessity, acceptanceReport, gradeDifficulty, humanSteps, withoutClue, withClues, minimizeClues } from './solver.js';
export { evaluatePlacement, deriveKiller } from './evaluate.js';
export { CLUE_TYPES, GLOBAL_RULE_TYPES } from './clues.js';
export { describeClue, describeStep, describeGlobalRule } from './describe.js';
export * as geometry from './geometry.js';
