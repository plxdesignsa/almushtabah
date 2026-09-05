#!/usr/bin/env node
// generate.js — توليد قضية واحدة أو مكتبة كاملة.
//
//   node src/cli/generate.js --size 16 --tier expert [--seed 7] [--theme house] [--id case-002] [--out cases] [--dry]
//   node src/cli/generate.js --library [--out cases] [--seed 2026]
//
// كل قضية تُكتب ملفين: cases/<id>.json (الرئيسي) و cases/i18n/ar/<id>.json (الترجمة)،
// وتُضاف إلى cases/catalog.json. الملف الرئيسي يمرّ على معايير القبول قبل الكتابة.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { arNum } from '../engine/describe.js';
import { Scene } from '../engine/scene.js';
import { acceptanceReport } from '../engine/solver.js';
import { generateCase } from '../generator/generate.js';

const args = process.argv.slice(2);
const opt = (name, def) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : def;
};
const flag = (name) => args.includes(`--${name}`);
const outDir = resolve(opt('out', 'cases'));

/** خطة المكتبة: ٢٠ قضية عبر كل الدرجات (القسم 12، المرحلة 1). */
const LIBRARY_PLAN = [
  ...[5, 6, 6, 7].map((size) => ({ size, tier: 'easy' })),
  ...[7, 8, 8, 9, 10].map((size) => ({ size, tier: 'medium' })),
  ...[10, 11, 12, 12, 13, 14].map((size) => ({ size, tier: 'hard' })),
  ...[14, 15, 16, 16, 16].map((size) => ({ size, tier: 'expert' })),
  // الشاهد الكاذب (القسم 11): الميكانيكا المميزة، بأحجام يسهل فيها تعقّب التناقض.
  { size: 7, tier: 'medium', lying: true }, { size: 8, tier: 'medium', lying: true }, { size: 9, tier: 'hard', lying: true }, { size: 11, tier: 'hard', lying: true },
];
const THEME_CYCLE = ['house', 'farm', 'market'];

function writeCase(result) {
  const { case: c, overlay } = result;
  mkdirSync(join(outDir, 'i18n', 'ar'), { recursive: true });
  writeFileSync(join(outDir, `${c.id}.json`), JSON.stringify(c, null, 2) + '\n');
  writeFileSync(join(outDir, 'i18n', 'ar', `${c.id}.json`), JSON.stringify(overlay, null, 2) + '\n');
}

function updateCatalog(entries) {
  const path = join(outDir, 'catalog.json');
  const existing = existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : [];
  const byId = new Map(existing.map((e) => [e.id, e]));
  for (const e of entries) byId.set(e.id, e);
  const merged = [...byId.values()].sort((a, b) => a.id.localeCompare(b.id));
  writeFileSync(path, JSON.stringify(merged, null, 2) + '\n');
  return merged.length;
}

function catalogEntry(result) {
  const c = result.case;
  return {
    id: c.id,
    file: `${c.id}.json`,
    title_ar: result.overlay.title,
    size: c.size,
    difficulty: c.difficulty,
    rooms: c.rooms.length,
    suspects: c.characters.length,
    clues: c.clues.length,
    mode: c.mode ?? 'classic',
    theme: c.meta.theme,
    seed: c.meta.seed,
  };
}

function gate(result) {
  const scene = new Scene(result.case);
  const report = acceptanceReport(scene);
  return report;
}

function summarize(result, report, ms) {
  const c = result.case;
  const ok = report.ok ? '✓' : '✗';
  const s = c.meta.stats;
  console.log(`${ok} ${c.id.padEnd(9)} ${String(c.size + '×' + c.size).padEnd(6)} هدف ${result.report.targetTier.padEnd(6)} قياس ${c.difficulty.padEnd(6)} غرف ${String(c.rooms.length).padStart(2)}  أدلة ${String(s.clues).padStart(2)}  أقصى/شخصية ${s.maxPerChar}  صامتون ${s.silentCharacters}  تلميحات ${String(s.hintSteps).padStart(2)}  ${ms}ms  بذرة ${c.meta.seed}${c.mode === 'lyingWitness' ? '  🤥' : ''}${report.ok ? '' : '  ← ' + report.issues.map((i) => i.code).join(',')}`);
}

if (flag('library')) {
  const baseSeed = Number(opt('seed', 2026));
  const startIndex = Number(opt('start', 2));
  console.log(`توليد مكتبة ${LIBRARY_PLAN.length} قضية — بذرة أساس ${baseSeed} — إلى ${outDir}`);
  const entries = [];
  let failures = 0;
  LIBRARY_PLAN.forEach((plan, i) => {
    const id = `case-${String(startIndex + i).padStart(3, '0')}`;
    const t0 = Date.now();
    const result = generateCase({ ...plan, id, seed: baseSeed * 1000 + i, theme: THEME_CYCLE[i % THEME_CYCLE.length], attempts: 12 });
    const report = gate(result);
    summarize(result, report, Date.now() - t0);
    if (!report.ok) { failures++; return; }
    if (!flag('dry')) { writeCase(result); entries.push(catalogEntry(result)); }
  });
  if (!flag('dry')) console.log(`الفهرس: ${arNum(updateCatalog(entries))} قضية في catalog.json`);
  process.exit(failures ? 1 : 0);
}

const size = Number(opt('size'));
if (!size) {
  console.error('الاستخدام: --size N [--tier easy|medium|hard|expert] [--lying] [--seed S] [--theme T] [--id ID] [--out DIR] [--dry]  |  --library');
  process.exit(2);
}
const t0 = Date.now();
const result = generateCase({
  size, tier: opt('tier', 'hard'), seed: opt('seed') !== undefined ? Number(opt('seed')) : undefined,
  theme: opt('theme'), id: opt('id'), attempts: Number(opt('attempts', 10)), lying: flag('lying'),
});
const report = gate(result);
summarize(result, report, Date.now() - t0);
if (flag('verbose')) result.report.attempts.forEach((a) => console.log('   محاولة', JSON.stringify(a)));
if (!report.ok) {
  console.error('لم تجتز معايير القبول:', JSON.stringify(report.issues));
  process.exit(1);
}
if (!flag('dry')) {
  writeCase(result);
  updateCatalog([catalogEntry(result)]);
  console.log(`كُتبت: ${join(outDir, result.case.id + '.json')} + i18n/ar/${result.case.id}.json`);
}
