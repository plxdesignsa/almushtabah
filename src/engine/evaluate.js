// evaluate.js — فحص صدق الأدلة والقواعد العامة على توزيع كامل.
//
// هذا هو معنى «قابل للفحص آليًا» في القسم 03: لأي توزيع، يقرّر المحرّك صدق كل دليل.
// يُستخدم للتحقق من القضية المكتوبة يدويًا قبل الاستنتاج، وسيستخدمه المولّد لاحقًا
// لإنتاج «كل الأدلة الصادقة».

import { CLUE_TYPES, GLOBAL_RULE_TYPES, roomCount } from './clues.js';
import { sharesLine } from './geometry.js';

/**
 * @param {import('./scene.js').Scene} scene
 * @param {number[]} placement  خلية كل شخصية (بترتيب id)
 * @returns {{ok:boolean, failures:Array<{kind:string,index:number,type:string}>}}
 */
export function evaluatePlacement(scene, placement) {
  const failures = [];

  // القواعد الهيكلية: واحد لكل صف وعمود، ولا خلية محجوبة.
  for (let a = 0; a < placement.length; a++) {
    if (scene.blockedCells.has(placement[a])) failures.push({ kind: 'structure', index: a, type: 'blockedCell' });
    for (let b = a + 1; b < placement.length; b++) {
      if (placement[a] === placement[b] || sharesLine(placement[a], placement[b], scene.size)) {
        failures.push({ kind: 'structure', index: a, type: 'rowColConflict', other: b });
      }
    }
  }

  scene.globalRules.forEach((rule) => {
    if (!GLOBAL_RULE_TYPES[rule.type].holds(scene, rule, placement)) {
      failures.push({ kind: 'globalRule', index: rule.index, type: rule.type });
    }
  });

  scene.clues.forEach((clue) => {
    if (!CLUE_TYPES[clue.type].holds(scene, clue, placement)) {
      failures.push({ kind: 'clue', index: clue.index, type: clue.type });
    }
  });

  return { ok: failures.length === 0, failures };
}

/**
 * القاتل لا يُسأل عنه أبدًا: هو من يشارك الضحية غرفتها عندما تحوي اثنين بالضبط.
 * يعيد رقم الشخصية أو null إن لم يكن هناك ضحية أو كان الجواب ملتبسًا.
 */
export function deriveKiller(scene, placement) {
  if (!scene.victim) return null;
  const roomId = scene.roomOfCell[placement[scene.victim.id]];
  if (roomCount(scene, placement, roomId) !== 2) return null;
  return placement.findIndex((cell, id) => id !== scene.victim.id && scene.roomOfCell[cell] === roomId);
}
