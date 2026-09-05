#!/usr/bin/env node
// solve.js — أداة سطر الأوامر للمرحلة صفر: حمّل قضية JSON وأثبت أنها تُحل بلا تخمين.
//
//   node src/cli/solve.js cases/case-001.json            ملخص + خريطة الحل
//   node src/cli/solve.js cases/case-001.json --trace    + سلسلة الاستنتاج كاملة
//   node src/cli/solve.js cases/case-001.json --minimal  + فحص ضرورة كل دليل
//   node src/cli/solve.js cases/case-001.json --prune    + اقتراح أصغر مجموعة أدلة (قلب المولّد)
//   node src/cli/solve.js cases/case-001.json --json     إخراج JSON خام (للأدوات)
//
// إن وُجد ملف cases/i18n/ar/<id>.json تُستخدم أسماؤه العربية في الإخراج.

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

import { arNum, describeClue, describeGlobalRule, describeStep, makeNamer } from '../engine/describe.js';
import { evaluatePlacement } from '../engine/evaluate.js';
import { sceneFromJSON } from '../engine/scene.js';
import { checkClueNecessity, minimizeClues, solve } from '../engine/solver.js';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
const flag = (name) => args.includes(`--${name}`);

if (!file) {
  console.error('الاستخدام: node src/cli/solve.js <case.json> [--trace] [--minimal] [--prune] [--json]');
  process.exit(2);
}

const path = resolve(file);
const scene = sceneFromJSON(readFileSync(path, 'utf8'));

const overlayPath = join(dirname(path), 'i18n', 'ar', `${scene.id}.json`);
const overlay = existsSync(overlayPath) ? JSON.parse(readFileSync(overlayPath, 'utf8')) : {};
const N = makeNamer(scene, overlay);

const result = solve(scene);
const necessity = flag('minimal') && result.solved ? checkClueNecessity(scene) : null;

if (flag('json')) {
  const { scene: _omit, ...plain } = result;
  console.log(JSON.stringify({ ...plain, necessity }, null, 2));
  process.exit(result.solved ? 0 : 1);
}

const line = (s = '') => console.log(s);
const rule = (ch = '─', n = 64) => line(ch.repeat(n));

rule('═');
line(`المشتبه — المستنتج · القضية: ${overlay.title ?? scene.id} · شبكة ${arNum(scene.size)}×${arNum(scene.size)} · ${arNum(scene.rooms.length)} غرف · ${arNum(scene.characters.length)} شخصيات`);
rule('═');

line('القواعد العامة:');
scene.globalRules.forEach((g) => line(`  • ${describeGlobalRule(scene, g, overlay)}`));
line();
line('الأدلة:');
scene.clues.forEach((c) => line(`  ${arNum(c.index + 1)}. ${describeClue(scene, c, overlay)}${c.implicit ? '  (بطاقة الضحية — تلقائية)' : ''}`));
line();

if (scene.solution) {
  const ev = evaluatePlacement(scene, scene.solution);
  line(`فحص صدق الأدلة على الحل المكتوب في الملف: ${ev.ok ? '✓ كلها صادقة' : '✗ مخالفات: ' + JSON.stringify(ev.failures)}`);
}

rule();
if (!result.ok) {
  line(`✗ متناقضة: ${result.contradiction.message}`);
} else if (!result.solved) {
  line('✗ لم تُحسم كل الشخصيات بالاستنتاج المباشر. المتبقي:');
  result.unpinned.forEach((u) => line(`  - ${N.char(u.char)}: ${arNum(u.remaining)} خلايا ممكنة`));
} else {
  line(`✓ حُلّت بالاستنتاج المباشر فقط — بلا تخمين ولا تراجع. ${arNum(result.rounds)} دورات، ${arNum(result.trace.length)} خطوة (${arNum(result.hintChain.length)} منها جوهرية).`);
  line(`  درجة الصعوبة المقاسة: ${result.tier}`);
  line(`  القواعد المستخدمة: ${Object.entries(result.rulesUsed).map(([k, v]) => `${k}×${arNum(v)}`).join('، ')}`);
  if (result.matchesSolution !== null) line(`  مطابقة الحل المكتوب في الملف: ${result.matchesSolution ? '✓' : '✗'}`);
  line(`  الأدلة صادقة على الحل المستنتج: ${result.clueCheck.ok ? '✓' : '✗'}`);
  if (result.victim !== null) {
    line(`  الضحية: ${N.char(result.victim)} → القاتل: ${result.killer === null ? 'ملتبس!' : N.char(result.killer)}`);
  }
  line();
  line('مواقع الشخصيات:');
  result.placement.forEach((cell, id) => {
    const tag = id === result.killer ? ' ← القاتل' : id === result.victim ? ' ← الضحية' : '';
    line(`  ${N.char(id).padEnd(10)} ${N.cell(cell)}  (${N.room(scene.roomOfCell[cell])})${tag}`);
  });
  line();
  printMap(scene, result.placement);
}

if (flag('trace') && result.trace.length) {
  rule();
  line('سلسلة الاستنتاج (كل خطوة مع سببها):');
  result.trace.forEach((s) => line('  ' + describeStep(scene, s, overlay)));
}

if (necessity) {
  rule();
  line('فحص ضرورة الأدلة (كل دليل يُحذف وحده ويُعاد الحل):');
  scene.clues.filter((c) => !c.implicit).forEach((c) => {
    const ok = necessity.necessary.includes(c.index);
    line(`  ${ok ? '✓ ضروري' : '✗ زائد  '}  ${arNum(c.index + 1)}. ${describeClue(scene, c, overlay)}`);
  });
  line(necessity.redundant.length
    ? `  → ${arNum(necessity.redundant.length)} دليل زائد؛ معيار القبول يطلب حذفه.`
    : '  → كل الأدلة ضرورية ✓');
}

if (flag('prune') && result.solved) {
  rule();
  const { kept, dropped } = minimizeClues(scene);
  line('التقليم (حذف الأدلة واحدًا واحدًا ما دام الاستنتاج يحل):');
  line(`  يُحذف: ${dropped.length ? dropped.map((i) => arNum(i + 1)).join('، ') : 'لا شيء'}`);
  line(`  يبقى:  ${kept.map((i) => arNum(i + 1)).join('، ')}`);
}
rule('═');

process.exit(result.solved ? 0 : 1);

/** خريطة نصية: حرف الغرفة في كل خلية، ورمز الشخصية حيث وُضعت. */
function printMap(scene, placement) {
  const ROOM_GLYPH = '·:∙°˙‥⋅';
  const charAt = new Map(placement.map((cell, id) => [cell, id]));
  const header = '     ' + Array.from({ length: scene.size }, (_, c) => String(c + 1).padStart(3)).join('');
  line(header);
  for (let r = 0; r < scene.size; r++) {
    let row = `  ${String(r + 1).padStart(2)} `;
    for (let c = 0; c < scene.size; c++) {
      const cell = r * scene.size + c;
      const roomId = scene.roomOfCell[cell];
      let glyph;
      if (scene.blockedCells.has(cell)) glyph = '█';
      else if (charAt.has(cell)) glyph = String.fromCharCode(65 + charAt.get(cell));
      else glyph = ROOM_GLYPH[roomId % ROOM_GLYPH.length];
      row += glyph.padStart(3);
    }
    line(row);
  }
  line();
  line('  الغرف: ' + scene.rooms.map((rm) => `${ROOM_GLYPH[rm.id % ROOM_GLYPH.length]}=${N.room(rm.id)}${rm.restricted ? '(مقيّدة)' : ''}`).join('  '));
  line('  الشخصيات: ' + scene.characters.map((ch) => `${String.fromCharCode(65 + ch.id)}=${N.char(ch.id)}`).join('  '));
}
