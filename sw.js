---
layout: null
---

const CACHE_NAME = 'janbalanya{{ site.time | date: "%s" }}';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', event => {
	event.waitUntil(
		fetch('/cache-list.json')
		.then(response => response.json())
		.then(files => {
			console.log('Service Worker: Caching ' + files.length + ' files from manifest...');
			return caches.open(CACHE_NAME).then(cache => {
				return cache.addAll(files);
			});
		})
		.catch(error => {
			console.error('Failed to cache files:', error)
		})
		);
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses, including cross-origin (relax type check)
        // Only skip if no response, non-200, or opaque (uncacheable)
        if (response && response.status === 200 && response.type !== 'opaque') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Always resolve to a Response, even on full failure
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // HTML fallback
          if (event.request.headers.get('accept')?.includes('text/html')) {
            return caches.match(OFFLINE_URL).then(offlineResponse => offlineResponse || new Response('Offline', { status: 503 }));
          }
          // Non-HTML miss: Return a 404 (script/image/etc. will fail gracefully)
          return new Response('', { status: 404, statusText: 'Not Found' });
        }).catch(() => {
          // Cache access failed (rare): 500
          return new Response('Service Unavailable', { status: 503 });
        });
      })
  );
});

self.addEventListener('activate', event => {
	event.waitUntil(
		caches.keys().then(cacheNames => {
			return Promise.all(
				cacheNames.map(cache => {
					if (cache !== CACHE_NAME) {
						return caches.delete(cache);
					}
				})
			);
		})
	);
});