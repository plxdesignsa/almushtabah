#!/usr/bin/env node
// deploy-pages.js — ينشر dist/ إلى فرع gh-pages في المستودع البعيد (GitHub Pages).
//
//   npm run deploy      (يبني أولًا ثم ينشر)
// يتطلب: git remote origin مضبوط، وصلاحية الدفع (gh auth). لا اعتماديات.

import { execSync } from 'node:child_process';
import { existsSync, rmSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('../', import.meta.url)));
const dist = join(root, 'dist');
const run = (cmd, cwd = root) => execSync(cmd, { cwd, stdio: 'pipe', encoding: 'utf8' }).trim();

if (!existsSync(join(dist, 'index.html'))) throw new Error('شغّل npm run build أولًا');
const origin = run('git remote get-url origin');
const sha = run('git rev-parse --short HEAD');

// مستودع مؤقت داخل dist/ بفرع واحد يُدفع بالقوة (تاريخ النشر لا يهم؛ المصدر في main).
rmSync(join(dist, '.git'), { recursive: true, force: true });
run('git init -q -b gh-pages', dist);
run('git config user.name "almushtabah-deploy"', dist);
run('git config user.email "deploy@almushtabah.local"', dist);
run('git add -A', dist);
run(`git commit -q -m "نشر ${sha}"`, dist);
run(`git push -f "${origin}" gh-pages:gh-pages`, dist);
rmSync(join(dist, '.git'), { recursive: true, force: true });
console.log(`نُشر فرع gh-pages من ${sha} إلى ${origin}`);
