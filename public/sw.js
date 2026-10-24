// Collabix PWA Service Worker (v3)
const CACHE_NAME = 'collabix-cache-v3';
const OFFLINE_URL = '/offline.html';

// Detect AI Studio Preview / local development environments where Service Worker must not cache or intercept
const IS_PREVIEW_ENV =
  self.location.hostname.includes('ais-dev-') ||
  self.location.hostname.includes('ais-pre-') ||
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1';

// Core static assets to pre-cache on production install
const STATIC_ASSETS = [
  '/offline.html',
  '/manifest.json',
  '/favicon.png',
  '/icon.svg',
  '/apple-touch-icon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

// Install: pre-cache offline fallback & icons on production; skip immediately on preview
self.addEventListener('install', (event) => {
  if (IS_PREVIEW_ENV) {
    self.skipWaiting();
    return;
  }

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        STATIC_ASSETS.map((asset) => cache.add(new Request(asset, { cache: 'reload' })))
      );
    })
  );
  self.skipWaiting();
});

// Activate: self-unregister and purge all caches in preview; clean outdated caches in production
self.addEventListener('activate', (event) => {
  if (IS_PREVIEW_ENV) {
    event.waitUntil(
      (async () => {
        const keys = await caches.keys();
        await Promise.all(keys.map((key) => caches.delete(key)));
        await self.registration.unregister();
        const clients = await self.clients.matchAll({ type: 'window' });
        for (const client of clients) {
          client.navigate(client.url).catch(() => {});
        }
      })()
    );
    return;
  }

  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        )
      )
      .then(() => self.clients.claim())
  );
});

// Fetch: Network-First for HTML navigations, Stale-While-Revalidate for static assets
self.addEventListener('fetch', (event) => {
  if (IS_PREVIEW_ENV) {
    return;
  }

  const req = event.request;
  const url = new URL(req.url);

  // 1. Only handle GET requests over HTTP(S)
  if (req.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // 2. Bypass Firebase, Google APIs, Telegram Bot API, and auth endpoints
  if (
    url.hostname.includes('firestore.googleapis.com') ||
    url.hostname.includes('firebase') ||
    url.hostname.includes('identitytoolkit') ||
    url.hostname.includes('securetoken.googleapis.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('api.telegram.org') ||
    url.pathname.startsWith('/__/')
  ) {
    return;
  }

  // 3. Bypass Vite dev server modules, source files, and HMR queries
  if (
    url.pathname.startsWith('/@') ||
    url.pathname.startsWith('/src/') ||
    url.pathname.startsWith('/node_modules/') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.ts') ||
    url.searchParams.has('t') ||
    url.searchParams.has('v')
  ) {
    return;
  }

  const isNavigation =
    req.mode === 'navigate' ||
    (req.headers.get('accept') && req.headers.get('accept').includes('text/html'));

  // 4. Network-First for HTML / navigation requests so updates always load immediately
  if (isNavigation) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            !networkResponse.redirected &&
            networkResponse.type === 'basic'
          ) {
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cachedHome = await caches.match('/');
          if (cachedHome) return cachedHome;

          const offlinePage = await caches.match(OFFLINE_URL);
          if (offlinePage) return offlinePage;

          return Response.error();
        })
    );
    return;
  }

  // 5. Stale-While-Revalidate for static icons, fonts, and hashed assets
  event.respondWith(
    caches.match(req).then((cachedResponse) => {
      const fetchPromise = fetch(req)
        .then((networkResponse) => {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            !networkResponse.redirected &&
            (networkResponse.type === 'basic' || networkResponse.type === 'cors')
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(req, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Message listener for skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
