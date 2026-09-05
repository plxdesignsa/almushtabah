// partial.js — فحص التناقض على لوحة ناقصة (القسم 08: حواجز لا تفضح).
//
// يُفحص ما وُضع فقط ضد الأدلة المعلنة والقواعد العامة. لا يُستشار الحل أبدًا،
// فلا يمكن أن يسرّب الجواب. الدليل يُعدّ مخالَفًا فقط حين تكون كل أطرافه موضوعة
// وتكون المخالفة مؤكدة مهما وُضع الباقون.

import { CLUE_TYPES } from '../../src/engine/clues.js';

/**
 * @param {import('../../src/engine/scene.js').Scene} scene
 * @param {number[]} placed  خلية كل شخصية أو -1
 * @returns {{clues:Set<number>, rules:Set<number>, cells:Set<number>}}
 */
export function partialViolations(scene, placed) {
  const clues = new Set();
  const rules = new Set();
  const cells = new Set();
  const room = (cell) => scene.roomOfCell[cell];
  const placedIn = (roomId) => placed.filter((c) => c >= 0 && room(c) === roomId).length;
  const all = placed.every((c) => c >= 0);
  const flag = (set, index, ...ids) => {
    set.add(index);
    for (const id of ids) if (placed[id] >= 0) cells.add(placed[id]);
  };

  for (const clue of scene.clues) {
    const def = CLUE_TYPES[clue.type];
    const p = placed[clue.char];
    if (p < 0) continue;
    if (def.kind === 'unary') {
      if (!def.cellPredicate(scene, clue)(p)) flag(clues, clue.index, clue.char);
    } else if (def.kind === 'binary') {
      const q = placed[clue.other];
      if (q >= 0 && !def.relation(scene, clue, p, q)) flag(clues, clue.index, clue.char, clue.other);
    } else if (def.kind === 'occupancy') {
      const count = def.count(clue);
      const n = placedIn(room(p));
      if (n > count || (all && n !== count)) flag(clues, clue.index, clue.char);
      if (clue.type === 'aloneWith' && placed[clue.other] >= 0 && room(placed[clue.other]) !== room(p)) flag(clues, clue.index, clue.char, clue.other);
    }
  }

  for (const rule of scene.globalRules) {
    if (rule.type === 'classRestriction') {
      for (const ch of scene.characters) {
        if (ch.class === rule.class && placed[ch.id] >= 0 && rule.forbiddenRooms.has(room(placed[ch.id]))) flag(rules, rule.index, ch.id);
      }
    } else if (rule.type === 'noEmptyRegion') {
      if (all) for (const r of rule.rooms) if (placedIn(r) === 0) rules.add(rule.index);
    } else if (rule.type === 'regionQuota') {
      const n = placedIn(rule.room);
      if (n > rule.count || (all && n !== rule.count)) rules.add(rule.index);
    } else if (rule.type === 'pairwiseClass') {
      const seen = new Map();
      for (const ch of scene.characters) {
        if (ch.class !== rule.class || placed[ch.id] < 0) continue;
        const r = room(placed[ch.id]);
        if (seen.has(r)) flag(rules, rule.index, ch.id, seen.get(r));
        seen.set(r, ch.id);
      }
    }
  }
  return { clues, rules, cells };
}
