// placement.js — اختيار حلّ عشوائي يحترم القواعد العامة وشرط الضحية.
//
// الحل: خلية لكل شخصية بصفوف وأعمدة فريدة، بحيث:
//   - الصنف الممنوع لا يدخل الغرف المقيّدة (classRestriction)
//   - كل غرفة مقيّدة فيها واحد على الأقل من الصنف المسموح (noEmptyRegion)
//   - توجد غرفة فيها شخصان بالضبط ليكون أحدهما الضحية والآخر القاتل
//
// حارس لكل غرفة مقيّدة أولًا، ثم الباقي عشوائيًا؛ فشل ⇒ محاولة جديدة.

import { rowOf, colOf } from '../engine/geometry.js';

/**
 * @param {import('../engine/random.js').Rng} rng
 * @param {object} layout  من generateLayout
 * @param {Array<{id:number, allowedInRestricted:boolean}>} characters
 * @returns {{placement:number[], victim:number, killer:number}|null}
 */
export function randomPlacement(rng, layout, characters) {
  const { size, roomMap, rooms, blockedCells } = layout;
  const blocked = new Set(blockedCells);
  const restrictedRooms = rooms.filter((r) => r.restricted).map((r) => r.id);
  const keepers = characters.filter((c) => c.allowedInRestricted).map((c) => c.id);
  if (keepers.length < restrictedRooms.length) return null;

  const cellsOfRoom = rooms.map(() => []);
  roomMap.forEach((id, cell) => {
    if (!blocked.has(cell)) cellsOfRoom[id].push(cell);
  });
  const allCells = [...roomMap.keys()].filter((c) => !blocked.has(c));

  for (let attempt = 0; attempt < 400; attempt++) {
    const usedRow = new Uint8Array(size);
    const usedCol = new Uint8Array(size);
    const placement = new Array(characters.length).fill(-1);
    const free = (cell) => !usedRow[rowOf(cell, size)] && !usedCol[colOf(cell, size)];
    const take = (id, cell) => {
      placement[id] = cell;
      usedRow[rowOf(cell, size)] = 1;
      usedCol[colOf(cell, size)] = 1;
    };

    let ok = true;
    const shuffledKeepers = rng.shuffle([...keepers]);
    for (const roomId of rng.shuffle([...restrictedRooms])) {
      const keeper = shuffledKeepers.pop();
      const cell = rng.shuffle([...cellsOfRoom[roomId]]).find(free);
      if (cell === undefined) { ok = false; break; }
      take(keeper, cell);
    }
    if (!ok) continue;

    for (const ch of rng.shuffle([...characters])) {
      if (placement[ch.id] >= 0) continue;
      const cand = rng.shuffle([...allCells]).find((cell) => free(cell) && (ch.allowedInRestricted || !rooms[roomMap[cell]].restricted));
      if (cand === undefined) { ok = false; break; }
      take(ch.id, cand);
    }
    if (!ok) continue;

    const pair = pickVictim(rng, placement, roomMap, characters);
    if (!pair) continue;
    return { placement, ...pair };
  }
  return null;
}

/** الضحية من غرفة فيها شخصان بالضبط؛ نفضّل أن تكون من الصنف الممنوع (الضيف) للدراما. */
function pickVictim(rng, placement, roomMap, characters) {
  const occupants = new Map();
  placement.forEach((cell, id) => {
    const r = roomMap[cell];
    if (!occupants.has(r)) occupants.set(r, []);
    occupants.get(r).push(id);
  });
  const pairs = [...occupants.values()].filter((ids) => ids.length === 2);
  if (!pairs.length) return null;
  const candidates = pairs.flatMap((ids) => ids.map((victim) => ({ victim, killer: ids.find((x) => x !== victim) })));
  const preferred = candidates.filter((c) => !characters[c.victim].allowedInRestricted);
  return rng.pick(preferred.length ? preferred : candidates);
}
