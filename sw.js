---
layout: null
---

const CACHE_PREFIX = 'janbalanya';
const CACHE_VERSION = '{{ site.time | date: "%s" }}';
const SHELL_CACHE = `${CACHE_PREFIX}-shell-${CACHE_VERSION}`;
const ASSET_CACHE = `${CACHE_PREFIX}-assets-${CACHE_VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, ASSET_CACHE];
const OFFLINE_URL = '/offline.html';
const SHELL_URLS = [
  OFFLINE_URL,
  '/assets/css/site.css'
];
const MAX_ASSET_ENTRIES = 24;
const ASSET_PATH_PREFIXES = [
  '/assets/css/',
  '/assets/js/',
  '/assets/fonts/'
];

async function installWorker() {
  const cache = await caches.open(SHELL_CACHE);

  try {
    await cache.addAll(SHELL_URLS);
  } catch (error) {
    await caches.delete(SHELL_CACHE);
    throw error;
  }

  await self.skipWaiting();
}

async function activateWorker() {
  const cacheNames = await caches.keys();
  const outdatedCaches = cacheNames.filter((cacheName) => (
    cacheName.startsWith(CACHE_PREFIX) && !CURRENT_CACHES.includes(cacheName)
  ));

  await Promise.all(outdatedCaches.map((cacheName) => caches.delete(cacheName)));
  await self.clients.claim();
}

function isNavigationRequest(request) {
  const accept = request.headers.get('accept');
  return request.mode === 'navigate' || (accept && accept.includes('text/html'));
}

function isStaticAsset(url) {
  return ASSET_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

function assetCacheKey(request) {
  const url = new URL(request.url);
  url.search = '';
  return url.toString();
}

async function trimCache(cache, maxEntries) {
  const keys = await cache.keys();
  const excess = keys.length - maxEntries;

  if (excess <= 0) return;

  await Promise.all(
    keys.slice(0, excess).map((request) => cache.delete(request))
  );
}

async function fetchAndCacheAsset(request, cacheKey) {
  const response = await fetch(request);

  if (response && response.status === 200 && response.type === 'basic') {
    try {
      const cache = await caches.open(ASSET_CACHE);
      await cache.put(cacheKey, response.clone());
      await trimCache(cache, MAX_ASSET_ENTRIES);
    } catch (error) {
      console.warn('Service Worker: unable to update the asset cache.', error);
    }
  }

  return response;
}

async function matchCachedAsset(cacheKey) {
  const assetCache = await caches.open(ASSET_CACHE);
  return (await assetCache.match(cacheKey)) || caches.match(cacheKey);
}

function staleWhileRevalidate(event) {
  const cacheKey = assetCacheKey(event.request);
  const networkResponse = fetchAndCacheAsset(event.request, cacheKey);

  event.waitUntil(networkResponse.then(() => undefined, () => undefined));

  return matchCachedAsset(cacheKey).then((cachedResponse) => (
    cachedResponse || networkResponse
  ));
}

async function networkFirstNavigation(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(SHELL_CACHE);
    const offlineResponse = await cache.match(OFFLINE_URL);

    if (offlineResponse) return offlineResponse;

    return new Response('Offline page unavailable', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(installWorker());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(activateWorker());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isNavigationRequest(request)) {
    event.respondWith(networkFirstNavigation(request));
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(staleWhileRevalidate(event));
  }
});
