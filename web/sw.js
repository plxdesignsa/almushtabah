// sw.js — عامل خدمة بسيط: يخزّن الهيكل والقضايا عند أول زيارة ليعمل التطبيق بلا إنترنت.
// الإصدار يُستبدل عند البناء (__VERSION__) فتُلغى الذاكرة القديمة تلقائيًا مع كل نشر.

const VERSION = '__VERSION__';
const CACHE = `mushtabah-${VERSION}`;
const SHELL = ['./', './index.html', './web/app/style.css', './web/app/main.js', './manifest.webmanifest'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// الشبكة أولًا (لتحديث المحتوى)، والذاكرة عند الانقطاع؛ الملفات الناجحة تُخزَّن.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request).then((res) => {
      if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
      return res;
    }).catch(() => caches.match(e.request).then((hit) => hit ?? caches.match('./index.html'))),
  );
});
