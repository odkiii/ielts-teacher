// Network-first для своих файлов, кэш — запасной вариант (офлайн). Supabase и чужие домены не трогаем.
const C = 'ielts-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(caches.keys().then((k) => Promise.all(k.filter((x) => x !== C).map((x) => caches.delete(x)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (e) => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith(fetch(r).then((res) => { if (res.ok) { const c = res.clone(); caches.open(C).then((x) => x.put(r, c)); } return res; }).catch(() => caches.match(r).then((m) => m || caches.match('./'))));
});
