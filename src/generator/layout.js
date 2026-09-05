// layout.js — توليد تخطيط المشهد: غرف متلاصقة تنمو من بذور متباعدة، أشياء، خلايا محجوبة.
//
// الهدف من المواصفات (القسم 10): نحو 0.85 غرفة لكل صف — غرف صغيرة تجعل «كان في الغرفة»
// دليلًا قويًا. البذور تُختار متباعدة حتى لا تخرج غرفة عملاقة وأخرى بخلية واحدة.

import { orthogonalNeighbours, rowOf, colOf } from '../engine/geometry.js';

export function defaultRoomCount(size) {
  return Math.max(3, Math.min(size - 1, Math.round(size * 0.85)));
}

/**
 * @param {import('../engine/random.js').Rng} rng
 * @param {object} theme  من content.js
 * @param {{size:number, roomCount?:number, restrictedCount?:number, objectCount?:number, blockedCount?:number}} opts
 */
export function generateLayout(rng, theme, opts) {
  const size = opts.size;
  const roomCount = opts.roomCount ?? defaultRoomCount(size);
  const restrictedCount = Math.min(opts.restrictedCount ?? Math.floor(roomCount / 2), roomCount - 1);
  const objectCount = opts.objectCount ?? Math.round(size * 1.5);
  const blockedCount = opts.blockedCount ?? 0;
  const cellCount = size * size;

  for (let attempt = 0; attempt < 50; attempt++) {
    const roomMap = growRooms(rng, size, roomCount);
    if (!roomMap) continue;

    // أصغر غرفة يجب أن تتّسع لشيء وشخص على الأقل.
    const sizes = new Array(roomCount).fill(0);
    roomMap.forEach((id) => sizes[id]++);
    if (Math.min(...sizes) < 2) continue;

    const rooms = pickRooms(rng, theme, roomCount, restrictedCount);
    const blockedCells = pickBlocked(rng, roomMap, sizes, blockedCount);
    const objects = placeObjects(rng, roomMap, rooms, blockedCells, objectCount);

    return { size, cellCount, roomMap: Array.from(roomMap), rooms, objects, blockedCells };
  }
  throw new Error(`تعذّر توليد تخطيط ${size}×${size} بعدد غرف ${roomCount}`);
}

/** بذور متباعدة (أفضل مرشّح من عدة عشوائيين) ثم نمو بطابور شبه FIFO مع اهتزاز. */
function growRooms(rng, size, roomCount) {
  const cellCount = size * size;
  const seeds = [];
  const dist = (a, b) => Math.abs(rowOf(a, size) - rowOf(b, size)) + Math.abs(colOf(a, size) - colOf(b, size));
  while (seeds.length < roomCount) {
    let best = -1;
    let bestScore = -1;
    for (let k = 0; k < 8; k++) {
      const cand = rng.int(cellCount);
      if (seeds.includes(cand)) continue;
      const score = seeds.length ? Math.min(...seeds.map((s) => dist(s, cand))) : 1;
      if (score > bestScore) {
        bestScore = score;
        best = cand;
      }
    }
    if (best < 0) return null;
    seeds.push(best);
  }

  const roomMap = new Int16Array(cellCount).fill(-1);
  const queue = [];
  seeds.forEach((cell, id) => {
    roomMap[cell] = id;
    queue.push(cell);
  });
  while (queue.length) {
    const i = rng.int(Math.min(queue.length, 3));
    const cur = queue.splice(i, 1)[0];
    for (const nb of rng.shuffle(orthogonalNeighbours(cur, size))) {
      if (roomMap[nb] !== -1) continue;
      roomMap[nb] = roomMap[cur];
      queue.push(nb);
    }
  }
  return roomMap;
}

function pickRooms(rng, theme, roomCount, restrictedCount) {
  const restrictedPool = rng.shuffle(theme.rooms.filter((r) => r.restricted));
  const freePool = rng.shuffle(theme.rooms.filter((r) => !r.restricted));
  const chosen = [...restrictedPool.slice(0, restrictedCount), ...freePool.slice(0, roomCount - restrictedCount)];
  if (chosen.length < roomCount) throw new Error(`البيئة «${theme.key}» لا تملك غرفًا كافية لـ${roomCount} غرفة`);
  rng.shuffle(chosen);
  return chosen.map((r, id) => ({ id, key: r.key, restricted: r.restricted, floor: r.floor, objectKeys: r.objects }));
}

function pickBlocked(rng, roomMap, sizes, blockedCount) {
  const blocked = new Set();
  const remaining = [...sizes];
  let guard = 0;
  while (blocked.size < blockedCount && guard++ < 200) {
    const cell = rng.int(roomMap.length);
    const room = roomMap[cell];
    if (blocked.has(cell) || remaining[room] <= 2) continue;
    blocked.add(cell);
    remaining[room]--;
  }
  return [...blocked].sort((a, b) => a - b);
}

function placeObjects(rng, roomMap, rooms, blockedCells, objectCount) {
  const blocked = new Set(blockedCells);
  const free = rng.shuffle([...roomMap.keys()].filter((c) => !blocked.has(c)));
  const objects = [];
  // شيء واحد على الأقل في كل غرفة، ثم الباقي عشوائيًا.
  const perRoom = new Map(rooms.map((r) => [r.id, 0]));
  for (const cell of free) {
    if (objects.length >= objectCount) break;
    const room = rooms[roomMap[cell]];
    const needed = [...perRoom.values()].some((n) => n === 0);
    if (needed && perRoom.get(room.id) > 0) continue;
    const key = rng.pick(room.objectKeys);
    objects.push({ cell, key, sprite: `obj_${key}`, variant: rng.between(1, 3) });
    perRoom.set(room.id, perRoom.get(room.id) + 1);
  }
  return objects.sort((a, b) => a.cell - b.cell);
}
