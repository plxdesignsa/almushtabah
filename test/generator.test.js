// اختبارات المولّد: الحتمية بالبذرة، اجتياز معايير القبول عبر الدرجات، والنجاح على ١٦×١٦.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Scene, acceptanceReport, createRng, hintLadder, solve } from '../src/engine/index.js';
import { generateCase } from '../src/generator/generate.js';
import { generateLayout } from '../src/generator/layout.js';
import { THEMES } from '../src/generator/content.js';

test('نفس البذرة تعطي نفس القضية بالضبط', () => {
  const a = generateCase({ size: 7, tier: 'medium', seed: 42, attempts: 3 });
  const b = generateCase({ size: 7, tier: 'medium', seed: 42, attempts: 3 });
  const strip = (c) => ({ ...c, meta: { ...c.meta, generatedAt: null } });
  assert.deepEqual(strip(a.case), strip(b.case));
});

test('التخطيط: كل غرفة متصلة وغير فارغة، وكل خلية لها غرفة', () => {
  const rng = createRng(3);
  const layout = generateLayout(rng, THEMES.house, { size: 12 });
  assert.equal(layout.roomMap.length, 144);
  const sizes = new Array(layout.rooms.length).fill(0);
  layout.roomMap.forEach((id) => sizes[id]++);
  assert.ok(sizes.every((s) => s >= 2));
  // اتصال كل غرفة بالتعبئة
  for (const room of layout.rooms) {
    const cells = layout.roomMap.map((id, c) => (id === room.id ? c : -1)).filter((c) => c >= 0);
    const seen = new Set([cells[0]]);
    const stack = [cells[0]];
    while (stack.length) {
      const cur = stack.pop();
      const r = Math.floor(cur / 12);
      const c = cur % 12;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nr = r + dr;
        const nc = c + dc;
        if (nr < 0 || nc < 0 || nr >= 12 || nc >= 12) continue;
        const nb = nr * 12 + nc;
        if (layout.roomMap[nb] === room.id && !seen.has(nb)) { seen.add(nb); stack.push(nb); }
      }
    }
    assert.equal(seen.size, cells.length, `الغرفة ${room.key} غير متصلة`);
  }
});

for (const [size, tier] of [[5, 'easy'], [7, 'medium'], [9, 'hard'], [12, 'expert']]) {
  test(`قضية مولّدة ${size}×${size} (${tier}) تجتاز معايير القبول وتطابق درجتها`, () => {
    const { case: c } = generateCase({ size, tier, seed: 100 + size, attempts: 6 });
    const scene = new Scene(c);
    const report = acceptanceReport(scene);
    assert.deepEqual(report.issues, []);
    assert.equal(c.difficulty, tier);
    const r = solve(scene);
    assert.equal(r.matchesSolution, true);
    assert.notEqual(r.killer, null);
    assert.ok(hintLadder(r.trace).length >= 1);
  });
}

test('١٦×١٦ خبير: يُولَّد ويجتاز معايير القبول', { timeout: 120_000 }, () => {
  const { case: c, report } = generateCase({ size: 16, tier: 'expert', seed: 7, attempts: 4 });
  const scene = new Scene(c);
  const acc = acceptanceReport(scene);
  assert.deepEqual(acc.issues, []);
  assert.equal(c.difficulty, 'expert');
  assert.equal(c.rooms.length, 14);
  assert.ok(report.stats.maxPerChar <= 3);
  assert.ok(c.clues.length <= 16 * 2.5, 'عدد الأدلة في نطاق معقول');
});

test('القاتل لا يُفضح مباشرة: لا دليل من القاتل يقول إنه في غرفة الضحية أو بجانبها', () => {
  const { case: c } = generateCase({ size: 10, tier: 'hard', seed: 55, attempts: 3 });
  const victim = c.characters.find((ch) => ch.victim).key;
  const roomOf = (key) => {
    const ch = c.characters.find((x) => x.key === key);
    const [r, col] = c.solution[ch.id];
    return c.roomMap[r * c.size + col];
  };
  const killer = c.characters.find((ch) => ch.key !== victim && roomOf(ch.key) === roomOf(victim)).key;
  const leak = c.clues.find((cl) => cl.char === killer && cl.other === victim && ['sameRoom', 'aloneWith', 'besideChar'].includes(cl.type));
  assert.equal(leak, undefined);
});
