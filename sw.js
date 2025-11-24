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
		caches.match(event.request).then(cachedResponse => {
			if (cachedResponse) {
				return cachedResponse;
			}
			
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
					if (event.request.headers.get('accept')?.includes('text/html')) {
						return caches.match(OFFLINE_URL);
					}
					// Return a proper response for non-HTML requests
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