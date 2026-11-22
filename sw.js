/* عامل الخدمة: يجلب أحدث نسخة من الشبكة دائماً، ويستخدم النسخة المحفوظة عند انقطاع الإنترنت */
const CACHE = 'sakura-michi';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' }).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)).catch(() => { }); }
      return res;
    }).catch(() => caches.match(req, { ignoreSearch: true }))
  );
});
