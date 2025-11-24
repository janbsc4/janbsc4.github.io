---
layout: null
---

const CACHE_NAME = 'janbalanya{{ site.time | date: "%s" }}';
const OFFLINE_URL = '/offline.html';

self.addEventListener('install', event => {
    // Force the waiting service worker to become the active service worker
    self.skipWaiting(); 
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

self.addEventListener('activate', event => {
    // Tell the active service worker to take control of the page immediately
    event.waitUntil(clients.claim());
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

self.addEventListener('fetch', event => {
	if (event.request.method !== 'GET') return;

	event.respondWith(
		caches.match(event.request).then(cachedResponse => {
            // 1. Return cached response immediately if found
			if (cachedResponse) {
				return cachedResponse;
			}
			
            // 2. If not in cache, try network
			return fetch(event.request)
				.then(response => {
					if (!response || response.status !== 200 || response.type !== 'basic') {
						return response;
					}
					const responseToCache = response.clone();
					caches.open(CACHE_NAME).then(cache => {
						cache.put(event.request, responseToCache);
					});
					return response;
				})
				.catch(() => {
                    // 3. Network failed (Offline)
                    const headers = event.request.headers;
                    
                    // Check if it is a navigation or an HTML request (including Turbo)
					if (
                        event.request.mode === 'navigate' || 
                        (headers.get('accept') && headers.get('accept').includes('text/html'))
                    ) {
						return caches.match(OFFLINE_URL);
					}
                    
					// Return a proper response for non-HTML requests so Turbo/JS doesn't crash hard
					return new Response('Offline - resource not available', {
						status: 503,
						statusText: 'Service Unavailable',
						headers: new Headers({
							'Content-Type': 'text/plain'
						})
					});
				});
		})
	);
});