// اختبارات منطق اللعب (web/app/game.js) — يعمل في Node لأن التخزين المحلي محميّ بمحاولة/التقاط.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';

import { sceneFromJSON, solve } from '../src/engine/index.js';
import { Game } from '../web/app/game.js';
import { partialViolations } from '../web/app/partial.js';

const scene = sceneFromJSON(readFileSync(new URL('../cases/case-001.json', import.meta.url), 'utf8'));
const sara = scene.charByKey.get('sara').id;
const khalid = scene.charByKey.get('khalid').id;
const cell = (r, c) => r * scene.size + c;

test('بلا تحديد: النقرة تبدّل علامة ✗', () => {
  const g = new Game(scene, 'test');
  assert.equal(g.tap(cell(2, 2)), 'mark');
  assert.ok(g.marks.has(cell(2, 2)));
  g.tap(cell(2, 2));
  assert.ok(!g.marks.has(cell(2, 2)));
});

test('مع تحديد: قلم ← تثبيت ← إزالة، والتثبيت يحجب الصف والعمود', () => {
  const g = new Game(scene, 'test');
  g.select(sara);
  assert.equal(g.tap(cell(0, 1)), 'pencil');
  assert.equal(g.pencil.get(cell(0, 1)), sara);
  assert.equal(g.tap(cell(0, 1)), 'commit');
  assert.equal(g.placed[sara], cell(0, 1));
  assert.equal(g.marks.size, 10, 'خمس خلايا في الصف وخمس في العمود');
  assert.equal(g.tap(cell(0, 1)), 'unplace');
  assert.equal(g.placed[sara], -1);
});

test('الخلية المشغولة لا تُستبدل، والتراجع يعيد الحالة', () => {
  const g = new Game(scene, 'test');
  g.select(sara);
  g.tap(cell(0, 1));
  g.tap(cell(0, 1));
  g.select(khalid);
  assert.equal(g.tap(cell(0, 1)), 'occupied');
  assert.ok(g.undo());
  assert.equal(g.placed[sara], -1, 'تراجع عن التثبيت');
  assert.ok(g.redo());
  assert.equal(g.placed[sara], cell(0, 1));
});

test('فحص التناقض يعلّم البطاقة المخالفة فقط ولا يستشير الحل', () => {
  const g = new Game(scene, 'test');
  g.commitDirect(khalid, cell(1, 3)); // المطبخ — يخالف «بجانب البئر»
  const v = partialViolations(scene, g.placed);
  const khalidClues = scene.clues.filter((c) => c.char === khalid).map((c) => c.index);
  assert.ok(khalidClues.some((i) => v.clues.has(i)));
  assert.ok(v.cells.has(cell(1, 3)));
  // وضع صحيح جزئي لا يُعلَّم
  const g2 = new Game(scene, 'test');
  g2.commitDirect(khalid, cell(2, 2));
  assert.equal(partialViolations(scene, g2.placed).clues.size, 0);
});

test('التسليم: الحل الصحيح يكشف القاتل، والخاطئ يعطي العدد فقط', () => {
  const g = new Game(scene, 'test');
  const r = solve(scene);
  scene.solution.forEach((c, id) => g.commitDirect(id, c));
  assert.equal(g.allPlaced, true);
  const ok = g.submit(scene.solution, r.killer);
  assert.equal(ok.correct, true);
  assert.equal(scene.char(ok.killer).key, 'khalid');

  const g2 = new Game(scene, 'test');
  scene.solution.forEach((c, id) => g2.commitDirect(id, id === sara ? cell(1, 4) : c));
  g2.commitDirect(scene.charByKey.get('reem').id, cell(0, 1));
  const bad = g2.submit(scene.solution, r.killer);
  assert.equal(bad.correct, false);
  assert.equal(bad.wrong, 2);
  assert.equal(bad.killer, null);
});
