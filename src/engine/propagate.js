// propagate.js — المستنتج (القسم 06-A من المواصفات).
//
// ليس عدّادًا ولا باحثًا. يحتفظ بمجال خلايا ممكنة لكل شخصية، ويطبّق قواعد استنتاج
// إلى أن تثبت المجالات (نقطة ثابتة). لا يوجد في هذا الملف أي تفرّع، أو تخمين،
// أو تراجع: كل حذف نتيجة مباشرة لدليل أو قاعدة، ويُسجَّل مع سببه في الأثر.
//
// القواعد المطبَّقة في كل دورة:
//   rowCol        — الشخصية المحسومة تحجب صفها وعمودها (وخليتها) عن الجميع.
//   hiddenSingle  — إن لم يبقَ لصف/عمود إلا شخصية واحدة ممكنة، فهي فيه حتمًا.
//   relation      — الأدلة الثنائية: تبقى الخلية إن كان لها «دعم» في مجال الشخصية الأخرى.
//   occupancy     — وحده / وحده مع / وحده مع القاتل / حصص الغرف / لا غرفة مقيّدة فارغة.
//   pairwiseClass — لا اثنان من صنف واحد في غرفة واحدة.
//
// أما الأدلة الأحادية وقيود الصنف والخلايا المحجوبة فتُطبَّق مرة واحدة عند التهيئة
// لأنها لا تعتمد على شيء غير الهندسة.

import { CLUE_TYPES } from './clues.js';
import { Domain } from './domain.js';

const MAX_ROUNDS = 10_000;

export class Contradiction extends Error {
  constructor(message, detail = {}) {
    super(message);
    this.name = 'Contradiction';
    this.detail = detail;
  }
}

/** حالة الاستنتاج: المجالات + الأثر. */
class State {
  constructor(scene) {
    this.scene = scene;
    this.domains = scene.characters.map(() => new Domain(Array.from({ length: scene.cellCount }, (_, i) => i)));
    this.trace = [];
    this.rulesUsed = new Map();
  }

  /**
   * الحذف الوحيد المسموح: كل خلية تُحذف من هنا فتُسجَّل مع سببها.
   * @returns {boolean} هل تغيّر شيء؟
   */
  eliminate(charId, shouldRemove, because) {
    const domain = this.domains[charId];
    const removed = domain.removeWhere(shouldRemove);
    if (removed.length === 0) return false;

    this.rulesUsed.set(because.rule, (this.rulesUsed.get(because.rule) ?? 0) + 1);
    this.trace.push({
      step: this.trace.length + 1,
      action: domain.isFixed ? 'isolate' : 'block',
      char: charId,
      cells: removed,
      remaining: domain.size,
      ...(domain.isFixed ? { cell: domain.fixed } : {}),
      because: because.ref,
      rule: because.rule,
      ...(because.note ? { note: because.note } : {}),
    });

    if (domain.isEmpty) {
      throw new Contradiction(`مجال الشخصية ${charId} فرغ`, { char: charId, because });
    }
    return true;
  }

  restrictTo(charId, shouldKeep, because) {
    return this.eliminate(charId, (cell) => !shouldKeep(cell), because);
  }

  fixedCell(charId) {
    return this.domains[charId].fixed;
  }
}

// ---------- التهيئة: القيود التي لا تعتمد إلا على الهندسة ----------

function seed(state) {
  const { scene } = state;

  if (scene.blockedCells.size) {
    for (const ch of scene.characters) {
      state.eliminate(ch.id, (cell) => scene.blockedCells.has(cell), { rule: 'blocked', ref: 'blockedCells' });
    }
  }

  for (const rule of scene.globalRules) {
    if (rule.type !== 'classRestriction') continue;
    for (const ch of scene.characters) {
      if (ch.class !== rule.class) continue;
      state.eliminate(ch.id, (cell) => rule.forbiddenRooms.has(scene.roomOfCell[cell]), {
        rule: 'classRestriction',
        ref: `globalRules[${rule.index}]`,
      });
    }
  }

  for (const clue of scene.clues) {
    const def = CLUE_TYPES[clue.type];
    if (def.kind !== 'unary') continue;
    const keep = def.cellPredicate(scene, clue);
    state.restrictTo(clue.char, keep, { rule: 'unary', ref: `clues[${clue.index}]` });
  }
}

// ---------- القواعد الدورية ----------

function rowColElimination(state) {
  const { scene, domains } = state;
  let changed = false;
  for (const ch of scene.characters) {
    const cell = state.fixedCell(ch.id);
    if (cell < 0) continue;
    const r = scene.rowOf(cell);
    const c = scene.colOf(cell);
    for (const other of scene.characters) {
      if (other.id === ch.id) continue;
      if (!domains[other.id].cells().some((x) => scene.rowOf(x) === r || scene.colOf(x) === c)) continue;
      changed |= state.eliminate(other.id, (x) => scene.rowOf(x) === r || scene.colOf(x) === c, {
        rule: 'rowCol',
        ref: `placed:${ch.id}`,
        note: `الشخصية ${ch.id} محسومة في الخلية ${cell}`,
      });
    }
  }
  return changed;
}

function hiddenSingles(state) {
  const { scene, domains } = state;
  let changed = false;
  for (const axis of ['row', 'col']) {
    const lineOf = axis === 'row' ? (x) => scene.rowOf(x) : (x) => scene.colOf(x);
    for (let k = 0; k < scene.size; k++) {
      const candidates = scene.characters.filter((ch) => domains[ch.id].cells().some((x) => lineOf(x) === k));
      if (candidates.length === 0) {
        throw new Contradiction(`لا أحد يمكنه شغل ${axis === 'row' ? 'الصف' : 'العمود'} ${k + 1}`, { axis, k });
      }
      if (candidates.length !== 1) continue;
      const ch = candidates[0];
      if (domains[ch.id].cells().every((x) => lineOf(x) === k)) continue;
      changed |= state.restrictTo(ch.id, (x) => lineOf(x) === k, {
        rule: 'hiddenSingle',
        ref: `${axis}:${k + 1}`,
        note: `لا أحد غير الشخصية ${ch.id} يمكنه شغل ${axis === 'row' ? 'الصف' : 'العمود'} ${k + 1}`,
      });
    }
  }
  return changed;
}

/**
 * مراجعة الدعم للأدلة الثنائية: تبقى خلية x للشخصية a فقط إن وُجدت خلية y في مجال b
 * تحقّق العلاقة ولا تصادم x في الصف أو العمود. تُطبَّق في الاتجاهين.
 */
function relations(state) {
  const { scene, domains } = state;
  let changed = false;
  for (const rel of state.binaryConstraints) {
    for (const [a, b, relation] of [
      [rel.char, rel.other, rel.forward],
      [rel.other, rel.char, rel.backward],
    ]) {
      const support = domains[b].cells();
      changed |= state.eliminate(
        a,
        (x) => !support.some((y) => y !== x && scene.rowOf(y) !== scene.rowOf(x) && scene.colOf(y) !== scene.colOf(x) && relation(x, y)),
        { rule: 'relation', ref: rel.ref },
      );
    }
  }
  return changed;
}

/** من يجب أن يكون في الغرفة (مجاله كله فيها) ومن يمكن أن يكون فيها. */
function roomCensus(state, roomId) {
  const { scene, domains } = state;
  const must = [];
  const may = [];
  for (const ch of scene.characters) {
    const d = domains[ch.id];
    let any = false;
    let all = true;
    for (const cell of d) {
      if (scene.roomOfCell[cell] === roomId) any = true;
      else all = false;
    }
    if (any) may.push(ch.id);
    if (any && all) must.push(ch.id);
  }
  return { must, may };
}

/**
 * قيد «الغرفة R تحوي بالضبط k»:
 *  - إن اكتمل العدد بمن يجب أن يكونوا فيها → يُحجب الباقون عنها.
 *  - إن كان عدد من يمكنهم دخولها = k → كلهم فيها حتمًا.
 */
function enforceExactOccupancy(state, roomId, count, because) {
  const { scene } = state;
  const { must, may } = roomCensus(state, roomId);
  if (must.length > count || may.length < count) {
    throw new Contradiction(`الغرفة ${roomId} لا يمكن أن تحوي ${count} بالضبط`, { roomId, count, must, may });
  }
  let changed = false;
  if (must.length === count) {
    for (const id of may) {
      if (must.includes(id)) continue;
      changed |= state.eliminate(id, (cell) => scene.roomOfCell[cell] === roomId, because);
    }
  }
  if (may.length === count) {
    for (const id of may) {
      changed |= state.restrictTo(id, (cell) => scene.roomOfCell[cell] === roomId, because);
    }
  }
  return changed;
}

function occupancy(state) {
  const { scene, domains } = state;
  let changed = false;

  // أدلة الإشغال المرتبطة بشخصية: وحده / وحده مع / وحده مع القاتل / k أشخاص.
  for (const clue of scene.clues) {
    const def = CLUE_TYPES[clue.type];
    if (def.kind !== 'occupancy') continue;
    const count = def.count(clue);
    const because = { rule: 'occupancy', ref: `clues[${clue.index}]` };
    const roomId = domains[clue.char].determinedRoom(scene.roomOfCell);

    if (roomId >= 0) {
      changed |= enforceExactOccupancy(state, roomId, count, because);
      continue;
    }
    // الغرفة غير محسومة بعد: استبعد كل غرفة لا يمكن أن يكتمل فيها العدد المطلوب.
    for (const candidateRoom of domains[clue.char].rooms(scene.roomOfCell)) {
      const { must, may } = roomCensus(state, candidateRoom);
      const impossible = may.length < count || (must.length >= count && !must.includes(clue.char));
      if (!impossible) continue;
      changed |= state.eliminate(clue.char, (cell) => scene.roomOfCell[cell] === candidateRoom, {
        ...because,
        note: `الغرفة ${candidateRoom} لا يمكن أن تضم ${count} بالضبط مع الشخصية ${clue.char}`,
      });
    }
  }

  // القواعد العامة على الغرف.
  for (const rule of scene.globalRules) {
    const because = { rule: rule.type, ref: `globalRules[${rule.index}]` };
    if (rule.type === 'regionQuota') {
      changed |= enforceExactOccupancy(state, rule.room, rule.count, because);
    } else if (rule.type === 'noEmptyRegion') {
      for (const roomId of rule.rooms) {
        const { must, may } = roomCensus(state, roomId);
        if (may.length === 0) throw new Contradiction(`الغرفة ${roomId} ستبقى فارغة`, { roomId });
        if (must.length > 0 || may.length !== 1) continue;
        changed |= state.restrictTo(may[0], (cell) => scene.roomOfCell[cell] === roomId, {
          ...because,
          note: `لا أحد غير الشخصية ${may[0]} يمكنه شغل الغرفة ${roomId}، وهي لا تُترك فارغة`,
        });
      }
    }
  }
  return changed;
}

function pairwiseClass(state) {
  const { scene, domains } = state;
  let changed = false;
  for (const rule of scene.globalRules) {
    if (rule.type !== 'pairwiseClass') continue;
    const members = scene.characters.filter((ch) => ch.class === rule.class);
    for (const ch of members) {
      const roomId = domains[ch.id].determinedRoom(scene.roomOfCell);
      if (roomId < 0) continue;
      for (const other of members) {
        if (other.id === ch.id) continue;
        changed |= state.eliminate(other.id, (cell) => scene.roomOfCell[cell] === roomId, {
          rule: 'pairwiseClass',
          ref: `globalRules[${rule.index}]`,
        });
      }
    }
  }
  return changed;
}

// ---------- اشتقاق القيود الثنائية من الأدلة ----------

function binaryConstraintsOf(scene) {
  const out = [];
  for (const clue of scene.clues) {
    const def = CLUE_TYPES[clue.type];
    const ref = `clues[${clue.index}]`;
    if (def.kind === 'binary') {
      out.push({
        char: clue.char,
        other: clue.other,
        ref,
        forward: (x, y) => def.relation(scene, clue, x, y),
        backward: (y, x) => def.relation(scene, clue, x, y),
      });
    } else if (clue.type === 'aloneWith') {
      // «وحده مع فلان» يتضمّن «في غرفة فلان».
      const same = (x, y) => scene.roomOfCell[x] === scene.roomOfCell[y];
      out.push({ char: clue.char, other: clue.other, ref, forward: same, backward: same });
    }
  }
  return out;
}

// ---------- الحلقة الرئيسية ----------

/**
 * يشغّل الاستنتاج حتى النقطة الثابتة.
 * @param {import('./scene.js').Scene} scene
 * @returns {{ok:boolean, solved:boolean, domains:Domain[], trace:object[], rulesUsed:Map, rounds:number, contradiction?:object}}
 */
export function propagate(scene) {
  const state = new State(scene);
  state.binaryConstraints = binaryConstraintsOf(scene);
  let rounds = 0;

  try {
    seed(state);
    let changed = true;
    while (changed) {
      if (++rounds > MAX_ROUNDS) throw new Error('تجاوز الاستنتاج الحد الأقصى للدورات');
      changed = false;
      changed = rowColElimination(state) || changed;
      changed = hiddenSingles(state) || changed;
      changed = relations(state) || changed;
      changed = occupancy(state) || changed;
      changed = pairwiseClass(state) || changed;
    }
  } catch (e) {
    if (!(e instanceof Contradiction)) throw e;
    return {
      ok: false,
      solved: false,
      domains: state.domains,
      trace: state.trace,
      rulesUsed: state.rulesUsed,
      rounds,
      contradiction: { message: e.message, ...e.detail },
    };
  }

  return {
    ok: true,
    solved: state.domains.every((d) => d.isFixed),
    domains: state.domains,
    trace: state.trace,
    rulesUsed: state.rulesUsed,
    rounds,
  };
}
