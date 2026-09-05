#!/usr/bin/env node
// verify.js — بوابة النشر: يمرّر كل قضايا مجلد على معايير القبول (القسم 13) ويطبع جدولًا.
//
//   node src/cli/verify.js cases                   يفحص ويطبع
//   node src/cli/verify.js cases --write-catalog   ويعيد بناء catalog.json من الملفات الناجحة

import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { sceneFromJSON } from '../engine/scene.js';
import { acceptanceReport, hintLadder } from '../engine/solver.js';

const args = process.argv.slice(2);
const dir = resolve(args.find((a) => !a.startsWith('--')) ?? 'cases');
const files = readdirSync(dir).filter((f) => f.startsWith('case-') && f.endsWith('.json')).sort();
let failed = 0;
const entries = [];
console.log('القضية    الحجم   الدرجة  غرف أدلة تلميحات  الحالة');
for (const f of files) {
  const raw = readFileSync(join(dir, f), 'utf8');
  const scene = sceneFromJSON(raw);
  const report = acceptanceReport(scene);
  const r = report.result;
  const ladder = r.solved ? hintLadder(r.trace).length : '-';
  const status = report.ok ? '✓' : '✗ ' + report.issues.map((i) => i.code).join(',');
  if (!report.ok) failed++;
  console.log(`${scene.id.padEnd(9)} ${String(scene.size + '×' + scene.size).padEnd(7)} ${String(r.tier ?? '-').padEnd(7)} ${String(scene.rooms.length).padStart(3)} ${String(scene.clues.filter((c) => !c.implicit).length).padStart(4)} ${String(ladder).padStart(7)}   ${status}`);
  if (report.ok) {
    const overlayPath = join(dir, 'i18n', 'ar', `${scene.id}.json`);
    const overlay = existsSync(overlayPath) ? JSON.parse(readFileSync(overlayPath, 'utf8')) : {};
    const meta = JSON.parse(raw).meta ?? {};
    entries.push({
      id: scene.id, file: f, title_ar: overlay.title ?? null, size: scene.size, difficulty: r.tier,
      rooms: scene.rooms.length, suspects: scene.characters.length, clues: scene.clues.filter((c) => !c.implicit).length,
      hints: ladder, theme: meta.theme ?? null, seed: meta.seed ?? null,
    });
  }
}
console.log(`${files.length - failed}/${files.length} قضية تجتاز معايير القبول`);
if (args.includes('--write-catalog')) {
  writeFileSync(join(dir, 'catalog.json'), JSON.stringify(entries, null, 2) + '\n');
  console.log(`catalog.json: ${entries.length} قضية`);
}
process.exit(failed ? 1 : 0);
