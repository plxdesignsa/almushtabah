#!/usr/bin/env node
// serve.js — خادم تطوير ثابت بلا اعتماديات: يقدّم جذر المشروع (web/ و src/engine/ و cases/).
//
//   node src/cli/serve.js [--port 5173] [--dir dist]
//   ثم افتح http://localhost:5173/   (مع --dir dist يقدّم حزمة النشر للمعاينة)

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('../../', import.meta.url)));
const args = process.argv.slice(2);
const port = Number(args[args.indexOf('--port') + 1]) || 5173;
const dirArg = args.indexOf('--dir') >= 0 ? args[args.indexOf('--dir') + 1] : null;
const root = dirArg ? resolve(projectRoot, dirArg) : projectRoot;
const indexPath = dirArg ? '/index.html' : '/web/index.html';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json',
};

createServer((req, res) => {
  let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (path === '/' || path === '/index.html') path = indexPath;
  const file = normalize(join(root, path));
  if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404');
    return;
  }
  res.writeHead(200, { 'Content-Type': MIME[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
  createReadStream(file).pipe(res);
}).listen(port, () => {
  console.log(`المشتبه — http://localhost:${port}/`);
});
