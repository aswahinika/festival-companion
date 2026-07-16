// Service worker for Festival Companion.
//
// Caching strategy (chosen so new content is never blocked by a stale cache):
//   * App SHELL (html/css/js/icons): cache-first, refreshed in the background.
//   * DATA (festivals.json) + navigations: network-FIRST, falling back to cache
//     when offline. So a freshly deployed festivals.json shows up immediately
//     while online, and the last-seen content is still available offline.
//
// TO PUBLISH UPDATED CONTENT/CODE: bump CACHE_VERSION below by one. Old caches
// are deleted on activation. (Documented in docs/ARCHITECTURE.md.)

const CACHE_VERSION = 'v1';
const CACHE_NAME = `festival-companion-${CACHE_VERSION}`;

const SHELL_ASSETS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/styles.css',
  'js/app.js',
  'js/utils.js',
  'js/i18n.js',
  'js/quiz.js',
  'js/validate.js',
  'js/icons.js',
  'js/config.js',
  'data/festivals.json',
  'assets/icons/icon.svg',
  'assets/icons/icon-192.png',
  'assets/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter(
              (k) => k.startsWith('festival-companion-') && k !== CACHE_NAME
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only handle our own origin — never cache third-party (e.g. Google Fonts).
  if (url.origin !== self.location.origin) return;

  const isData = url.pathname.endsWith('/data/festivals.json');
  const isNavigation = request.mode === 'navigate';

  if (isData || isNavigation) {
    event.respondWith(networkFirst(request, isNavigation));
  } else {
    event.respondWith(cacheFirst(request));
  }
});

async function networkFirst(request, isNavigation) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (isNavigation) {
      const shell = await cache.match('index.html');
      if (shell) return shell;
    }
    throw err;
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) {
    // Refresh in the background for next time (stale-while-revalidate).
    fetch(request)
      .then((response) => {
        if (response && response.ok) cache.put(request, response.clone());
      })
      .catch(() => {});
    return cached;
  }
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}
