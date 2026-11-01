// Service worker: makes Lilla Bil work offline once it has been opened online.
// Network first (always the newest version when online), cached copy when offline
// or when the network takes longer than 3 seconds.

// Bump the version when releasing so every device downloads the new app files.
const SHELL = 'lb-shell-v9';

const APP_FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'assets/moose.webp',
  'assets/logo.webp',
  'assets/icon-512.png',
  'assets/apple-touch-icon.png',
  'assets/fonts/Baloo2-latin.woff2',
  'assets/fonts/Baloo2-latin-ext.woff2',
];

self.addEventListener('install', (event) => {
  // cache: 'reload' skips the browser's HTTP cache, so we never store an old copy
  event.waitUntil(caches.open(SHELL)
    .then((c) => c.addAll(APP_FILES.map((f) => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key.startsWith('lb-shell-') && key !== SHELL) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(networkFirst(req));
});

async function networkFirst(req) {
  const cache = await caches.open(SHELL);
  const network = fetch(req, { cache: 'no-cache' })
    .then((res) => { if (res.ok) cache.put(req, res.clone()); return res; })
    .catch(() => null);
  const slow = new Promise((resolve) => setTimeout(() => resolve(null), 3000));
  const res = await Promise.race([network, slow]);
  if (res) return res;
  const hit = (await cache.match(req, { ignoreSearch: true }))
    || (req.mode === 'navigate' ? await cache.match('index.html') : null);
  return hit || (await network) || Response.error();
}
