// اختبارات المستنتج على القضية المكتوبة يدويًا.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { checkClueNecessity, evaluatePlacement, geometry, minimizeClues, propagate, sceneFromJSON, solve, withoutClue } from '../src/engine/index.js';

const CASE_PATH = new URL('../cases/case-001.json', import.meta.url);
const loadCase = () => sceneFromJSON(readFileSync(CASE_PATH, 'utf8'));
const rawCase = () => JSON.parse(readFileSync(CASE_PATH, 'utf8'));

test('القضية 001 تُحل بالاستنتاج المباشر وتثبّت كل شخصية', () => {
  const r = solve(loadCase());
  assert.equal(r.ok, true, 'لا متناقضة');
  assert.equal(r.solved, true, 'كل الشخصيات محسومة');
  assert.equal(r.unpinned.length, 0);
  assert.equal(r.matchesSolution, true, 'الحل المستنتج يطابق الحل المكتوب');
  assert.equal(r.clueCheck.ok, true, 'كل الأدلة صادقة على الحل');
});

test('القاتل يُستخرج من الخريطة لا من سؤال مباشر', () => {
  const r = solve(loadCase());
  const scene = r.scene;
  assert.equal(scene.char(r.victim).key, 'fahd');
  assert.equal(scene.char(r.killer).key, 'khalid');
});

test('الحل المكتوب يحقّق القواعد الهيكلية والقواعد العامة وكل الأدلة', () => {
  const scene = loadCase();
  const ev = evaluatePlacement(scene, scene.solution);
  assert.deepEqual(ev.failures, []);
});

test('كل دليل صريح ضروري: حذف أي واحد يكسر قابلية الحل', () => {
  const scene = loadCase();
  const { redundant } = checkClueNecessity(scene);
  assert.deepEqual(redundant, []);
});

test('المستنتج لا يخمّن: قضية ناقصة الأدلة تعود «غير محلولة» لا محلولة بالصدفة', () => {
  const scene = loadCase();
  const trimmed = withoutClue(scene, 0); // بدون دليل سارة
  const r = propagate(trimmed);
  assert.equal(r.ok, true);
  assert.equal(r.solved, false);
  assert.ok(r.domains.some((d) => d.size > 1));
});

test('دليل كاذب يُكشف كمتناقضة لا كحل خاطئ', () => {
  const raw = rawCase();
  raw.clues.push({ char: 'khalid', type: 'inRoom', room: 'kitchen' }); // كذب: خالد في الحوش
  const r = solve(raw);
  assert.equal(r.ok, false);
  assert.ok(r.contradiction);
});

test('الأثر يسجّل كل حذف مع سببه، ويحتوي خطوات إشغال الغرفة (بطاقة الضحية)', () => {
  const r = solve(loadCase());
  assert.ok(r.trace.length > 0);
  for (const step of r.trace) {
    assert.ok(['block', 'isolate'].includes(step.action));
    assert.ok(step.cells.length > 0);
    assert.ok(typeof step.because === 'string' && step.because.length > 0);
  }
  const victimClue = r.scene.clues.find((c) => c.type === 'aloneWithKiller');
  assert.ok(r.trace.some((s) => s.because === `clues[${victimClue.index}]`), 'بطاقة الضحية «وحده مع القاتل» أسهمت في الاستنتاج');
  assert.ok(r.rulesUsed.noEmptyRegion >= 1, 'قاعدة «لا غرفة مقيّدة فارغة» أسهمت في الاستنتاج');
  assert.ok(r.rulesUsed.hiddenSingle >= 1);
  assert.ok(['hard', 'expert'].includes(r.tier));
});

test('شخصيات بلا أي دليل تُحسم من القواعد العامة وحدها', () => {
  const r = solve(loadCase());
  const withClue = new Set(r.scene.clues.filter((c) => !c.implicit).map((c) => c.char));
  const silent = r.scene.characters.filter((c) => !withClue.has(c.id)).map((c) => c.key);
  assert.ok(silent.includes('nasser') && silent.includes('reem'));
  assert.equal(r.solved, true);
});

test('التقليم لا يجد شيئًا يحذفه في قضية أصغرية', () => {
  const { dropped, kept } = minimizeClues(loadCase());
  assert.deepEqual(dropped, []);
  assert.equal(kept.length, 4);
});

test('الجوار لا يعبر جدار الغرفة', () => {
  const scene = loadCase();
  const size = scene.size;
  const well = geometry.cellIndex(2, 3, size);
  const left = geometry.cellIndex(2, 2, size); // الحوش
  const right = geometry.cellIndex(2, 4, size); // المطبخ
  assert.equal(scene.isBeside(well, left), true);
  assert.equal(scene.isBeside(well, right), false);
  assert.equal(scene.isBeside(well, geometry.cellIndex(3, 4, size)), false, 'القطر لا يُحتسب');
});

test('المراجع بالمفتاح والرقم متكافئة', () => {
  const raw = rawCase();
  raw.clues[0] = { char: 3, type: 'onObject', object: 'table' };
  const scene = sceneFromJSON(JSON.stringify(raw));
  assert.equal(scene.clues[0].char, 3);
  assert.equal(solve(scene).solved, true);
});

test('ملف قضية مكسور يرفض برسالة واضحة', () => {
  const raw = rawCase();
  raw.roomMap.pop();
  assert.throws(() => sceneFromJSON(JSON.stringify(raw)), /roomMap/);
  const raw2 = rawCase();
  raw2.solution[0] = [5, 1]; // يصادم سارة في العمود
  assert.throws(() => sceneFromJSON(JSON.stringify(raw2)), /صف وعمود/);
});
