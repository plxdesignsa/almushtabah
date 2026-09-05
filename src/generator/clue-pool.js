// clue-pool.js — كل الأدلة الصادقة (المفيدة) عن حلّ معيّن.
//
// المولّد يبدأ من هنا: مجموعة أدلة صادقة كبيرة تجعل القضية محلولة بالبناء،
// ثم يحذف منها. لا نضع في المجمّع أدلة تفضح القاتل مباشرة (علاقته المباشرة بالضحية)،
// ولا أدلة للضحية سوى بطاقتها الثابتة «كان وحده مع القاتل».
//
// ترتيب الحذف يعتمد على «وزن الإسقاط» لكل نوع: الأنواع ذات الوزن الأعلى تُجرَّب للحذف
// أولًا فتبقى الأدلة الأجمل. الأوزان تختلف بالدرجة (السهل يفضّل الأدلة المباشرة).

import { roomCount } from '../engine/clues.js';

export const DROP_WEIGHTS = {
  // السهل والمتوسط: نحب الأدلة الملموسة (عند/بجانب شيء، في غرفة) ونضحّي بالحسابية.
  // الإحداثي (inRow/inCol) دائمًا أول ما يُحذف: لا يبقى إلا حين لا بديل مشهدي له.
  easy: { inRow: 9, inCol: 9, notOnObject: 6, notInRoom: 5, diffRoom: 5, notBesideObject: 4, inRoom: 2, onObject: 1, besideObject: 1, colOffset: 5, rowOffset: 5, besideChar: 3, sameRoom: 3, aloneInRoom: 3, aloneWith: 3 },
  medium: { inRow: 9, inCol: 9, notOnObject: 6, notInRoom: 4, onObject: 4, inRoom: 3, notBesideObject: 3, diffRoom: 3, colOffset: 3.5, rowOffset: 3.5, besideObject: 2, sameRoom: 2, besideChar: 1, aloneInRoom: 3, aloneWith: 3 },
  // الصعب والخبير: نضحّي بالتثبيت المباشر أولًا لتبقى أدلة المكان والجوار والإشغال؛
  // الإزاحات الحسابية تُحذف قبلها حتى لا تطغى على البطاقات.
  hard: { inRow: 9, inCol: 9, onObject: 6, colOffset: 5.5, rowOffset: 5.5, notOnObject: 5, inRoom: 4, notInRoom: 3.5, diffRoom: 3, notBesideObject: 2.5, sameRoom: 1.5, besideObject: 1, besideChar: 1, aloneInRoom: 1, aloneWith: 1 },
};
DROP_WEIGHTS.expert = DROP_WEIGHTS.hard;

/**
 * @param {import('../engine/random.js').Rng} rng
 * @param {import('../engine/scene.js').Scene} scene  مشهد بلا أدلة (أو بأي أدلة؛ تُتجاهل)
 * @param {number[]} placement
 * @param {{victim:number, killer:number}} roles
 * @returns {object[]} أدلة بصيغة JSON (char/other أرقام، room/object مفاتيح)
 */
export function buildCluePool(rng, scene, placement, { victim, killer }) {
  const { size, roomOfCell, rooms, objects } = scene;
  const pool = [];
  const add = (clue) => pool.push(clue);
  const row = (cell) => scene.rowOf(cell);
  const col = (cell) => scene.colOf(cell);
  const objectKeys = [...new Set(objects.map((o) => o.key))];
  const occupants = (roomId) => roomCount(scene, placement, roomId);

  for (const ch of scene.characters) {
    if (ch.id === victim) continue;
    const p = placement[ch.id];
    const rm = roomOfCell[p];
    const others = scene.characters.filter((o) => o.id !== ch.id);

    // ---- أحادية ----
    add({ char: ch.id, type: 'inRoom', room: rooms[rm].key });
    for (const r of rng.sample(rooms.filter((r) => r.id !== rm), Math.min(3, rooms.length - 1))) {
      add({ char: ch.id, type: 'notInRoom', room: r.key });
    }
    for (const k of objectKeys.filter((k) => scene.objectCells(k).has(p))) add({ char: ch.id, type: 'onObject', object: k });
    const besideKeys = objectKeys.filter((k) => scene.besideObjectCells(k).has(p));
    for (const k of besideKeys) add({ char: ch.id, type: 'besideObject', object: k });
    const notBeside = objectKeys.filter((k) => !scene.besideObjectCells(k).has(p));
    for (const k of rng.sample(notBeside, Math.min(2, notBeside.length))) add({ char: ch.id, type: 'notBesideObject', object: k });
    const notOn = objectKeys.filter((k) => !scene.objectCells(k).has(p));
    if (notOn.length) add({ char: ch.id, type: 'notOnObject', object: rng.pick(notOn) });
    // لا أدلة إحداثية («كنت في الصف ٩»): تعتمد على ترقيم الشبكة لا على المشهد، وتلتبس على اللاعب.
    // المحرّك يدعم inRow/inCol للقضايا المكتوبة يدويًا فقط.

    // ---- ثنائية ----
    const revealsKiller = (o) => (ch.id === killer && o.id === victim);
    const offsets = [];
    for (const o of others) {
      const q = placement[o.id];
      if (scene.isBeside(p, q) && !revealsKiller(o)) add({ char: ch.id, type: 'besideChar', other: o.id });
      if (roomOfCell[q] === rm && !revealsKiller(o)) add({ char: ch.id, type: 'sameRoom', other: o.id });
      const dr = row(p) - row(q);
      const dc = col(p) - col(q);
      // الإزاحة بصف/عمود واحد تُقرأ طبيعيًا («فوقه مباشرة»)؛ بصفّين مقبولة؛ أكثر من ذلك حسابي ممل.
      if (Math.abs(dr) === 1 || (Math.abs(dr) === 2 && rng.chance(0.4))) offsets.push({ char: ch.id, type: 'rowOffset', n: dr, other: o.id });
      if (Math.abs(dc) === 1 || (Math.abs(dc) === 2 && rng.chance(0.4))) offsets.push({ char: ch.id, type: 'colOffset', n: dc, other: o.id });
    }
    // إزاحة واحدة لكل شاهد على الأكثر، حتى لا تطغى على البطاقات.
    if (offsets.length) add(rng.pick(offsets));
    const different = others.filter((o) => roomOfCell[placement[o.id]] !== rm);
    for (const o of rng.sample(different, Math.min(2, different.length))) add({ char: ch.id, type: 'diffRoom', other: o.id });

    // ---- إشغال ----
    const n = occupants(rm);
    if (n === 1) add({ char: ch.id, type: 'aloneInRoom' });
    if (n === 2) {
      const mate = others.find((o) => roomOfCell[placement[o.id]] === rm);
      if (!revealsKiller(mate)) add({ char: ch.id, type: 'aloneWith', other: mate.id });
    }
  }

  add({ char: victim, type: 'aloneWithKiller' });
  return pool;
}

/**
 * ترتيب محاولة الحذف: وزن النوع + اهتزاز عشوائي. الأعلى يُجرَّب أولًا.
 * بطاقة الضحية لا تدخل الترتيب (لا تُحذف).
 */
export function removalOrder(rng, clues, tier) {
  const weights = DROP_WEIGHTS[tier] ?? DROP_WEIGHTS.hard;
  return clues
    .map((c, index) => ({ index, score: (weights[c.type] ?? 3) + rng.next() * 2.5, type: c.type }))
    .filter((x) => x.type !== 'aloneWithKiller')
    .sort((a, b) => b.score - a.score)
    .map((x) => x.index);
}
