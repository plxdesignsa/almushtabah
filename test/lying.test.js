// اختبارات نمط الشاهد الكاذب (القسم 11): الضمانات الأربع قابلة للفحص آليًا.
import assert from 'node:assert/strict';
import { test } from 'node:test';

import { Scene, acceptanceReport, deriveKiller, lyingWitnessReport, propagate, solve, withClues } from '../src/engine/index.js';
import { generateCase } from '../src/generator/generate.js';
import { partialViolations } from '../web/app/partial.js';

const make = (size, tier, seed) => new Scene(generateCase({ size, tier, seed, lying: true, attempts: 12 }).case);

test('قضية شاهد كاذب ٧×٧: كذبة واحدة، صاحبها القاتل، وتجتاز معايير القبول', () => {
  const scene = make(7, 'medium', 31);
  assert.equal(scene.mode, 'lyingWitness');
  assert.equal(scene.clues.filter((c) => c.lie).length, 1);
  const report = acceptanceReport(scene);
  assert.deepEqual(report.issues, []);
  const r = solve(scene);
  assert.equal(r.solved, true);
  assert.equal(r.killer, scene.liar, 'الكاذب هو القاتل');
});

test('كل البطاقات معًا ⇒ تناقض؛ بدون بطاقة الكاذب ⇒ حلّ يطابق الحل المكتوب', () => {
  const scene = make(9, 'hard', 32);
  const all = propagate(scene);
  assert.equal(all.ok, false, 'الكذبة تُكتشف بالتناقض');
  const truth = propagate(withClues(scene, scene.truthfulClues));
  assert.equal(truth.solved, true);
  const placement = truth.domains.map((d) => d.fixed);
  assert.deepEqual(placement, scene.solution);
  assert.equal(deriveKiller(scene, placement), scene.liar);
});

test('لا يمكن اتهام بريء: استبعاد بطاقة أي شاهد آخر لا يحلّ القضية', () => {
  const scene = make(8, 'medium', 34);
  const rep = lyingWitnessReport(scene);
  assert.deepEqual(rep.issues, []);
  for (const ch of scene.characters) {
    if (ch.id === scene.liar || ch.victim) continue;
    const without = scene.clues.filter((c) => c.char !== ch.id || c.implicit);
    if (without.length === scene.clues.length) continue;
    const r = propagate(withClues(scene, without));
    assert.ok(!(r.ok && r.solved), `استبعاد ${ch.key} حلّ القضية`);
  }
});

test('فحص التناقض في الواجهة يتجاهل بطاقة الشاهد المكذَّب', () => {
  const scene = make(7, 'medium', 31);
  const placed = [...scene.solution];
  const withLie = partialViolations(scene, placed);
  assert.ok(withLie.clues.size >= 1, 'الحل الصحيح يخالف الكذبة فتُعلَّم');
  const doubted = partialViolations(scene, placed, new Set([scene.liar]));
  assert.equal(doubted.clues.size, 0, 'بعد تكذيب القاتل لا مخالفات');
});
