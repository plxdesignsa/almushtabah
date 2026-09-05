#!/usr/bin/env node
// build.js — يبني حزمة نشر ثابتة في dist/ بلا أي اعتماديات:
//   dist/index.html            (من web/index.html)
//   dist/web/app, dist/web/art (الواجهة ونظام الفن)
//   dist/src/engine            (المحرّك كما هو — يعمل في المتصفح)
//   dist/cases                 (المكتبة + الترجمات + الفهرس، بعد اجتيازها معايير القبول)
//   dist/manifest.webmanifest, dist/sw.js, dist/icon.svg, dist/404.html
// المسارات في الصفحة مطلقة من الجذر، فالحزمة تعمل على أي استضافة ثابتة من جذر النطاق.

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const dist = join(root, 'dist');

// بوابة النشر أولًا: لا تُبنى حزمة فيها قضية مكسورة.
execSync('node src/cli/verify.js cases', { cwd: root, stdio: 'inherit' });

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const version = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12);
cpSync(join(root, 'web/app'), join(dist, 'web/app'), { recursive: true });
cpSync(join(root, 'web/art'), join(dist, 'web/art'), { recursive: true });
cpSync(join(root, 'src/engine'), join(dist, 'src/engine'), { recursive: true });
mkdirSync(join(dist, 'cases/i18n/ar'), { recursive: true });
for (const f of readdirSync(join(root, 'cases'))) if (f.endsWith('.json')) cpSync(join(root, 'cases', f), join(dist, 'cases', f));
cpSync(join(root, 'cases/i18n/ar'), join(dist, 'cases/i18n/ar'), { recursive: true });

const html = readFileSync(join(root, 'web/index.html'), 'utf8').replace('</head>', `  <link rel="manifest" href="/manifest.webmanifest" />\n  <meta name="theme-color" content="#1d1a16" />\n  <meta name="build" content="${version}" />\n</head>`);
writeFileSync(join(dist, 'index.html'), html);
writeFileSync(join(dist, '404.html'), html);
writeFileSync(join(dist, 'sw.js'), readFileSync(join(root, 'web/sw.js'), 'utf8').replace('__VERSION__', version));
cpSync(join(root, 'web/manifest.webmanifest'), join(dist, 'manifest.webmanifest'));
cpSync(join(root, 'web/icon.svg'), join(dist, 'icon.svg'));
writeFileSync(join(dist, '_headers'), '/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n/sw.js\n  Cache-Control: no-cache\n');

const size = (dir) => readdirSync(dir).reduce((s, f) => { const p = join(dir, f); return s + (statSync(p).isDirectory() ? size(p) : statSync(p).size); }, 0);
console.log(`dist/ جاهزة — الإصدار ${version} — ${(size(dist) / 1024).toFixed(0)} كيلوبايت`);
if (!existsSync(join(dist, 'cases/catalog.json'))) throw new Error('catalog.json مفقود');
