const CACHE_VERSION = 'wari2026-v34';
const APP_SHELL = [
  './',
  './index.html',
  './app.html',
  './app-proper.html',
  './map.html',
  './offline.html',
  './manifest.webmanifest',
  './assets/css/app.css',
  './assets/css/app-proper.css',
  './assets/css/map.css',
  './assets/css/offline.css',
  './assets/css/shell.css',
  './assets/js/app.js',
  './assets/js/app-proper.js',
  './assets/js/map.js',
  './assets/js/shell.js',
  './wari-data.js',
  './wari-points-1.js',
  './wari-points-2.js',
  './wari-points-3.js',
  './wari-points-4.js',
  './wari-points-5.js',
  './wari-points-tukaram.js',
  './wari-points-dnyaneshwar-halts.js',
  './wari-route-dnyaneshwar-pune.js',
  './wari-points-tukaram-halts.js',
  './wari-points-satara.js',
  './wari-points-hirkani.js',
  './wari-points-private.js',
  './assets/img/hirkani-booth.jpg',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
  'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => Promise.allSettled(APP_SHELL.map(url => cache.add(url)))));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

function isDataOrAppRequest(url) {
  return url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.webmanifest') || url.pathname.includes('wari-points-') || url.pathname.includes('wari-data');
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_VERSION);
  const cached = await cache.match(request);
  const networkPromise = fetch(request).then(response => {
    if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone());
    return response;
  }).catch(() => null);
  return cached || await networkPromise || caches.match('./offline.html');
}

async function networkFirst(request) {
  const cache = await caches.open(CACHE_VERSION);
  try {
    const response = await fetch(request);
    if (response && (response.ok || response.type === 'opaque')) cache.put(request, response.clone());
    return response;
  } catch (e) {
    return await cache.match(request) || await caches.match('./offline.html');
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (request.mode === 'navigate') { event.respondWith(networkFirst(request)); return; }
  if (url.origin === location.origin && isDataOrAppRequest(url)) { event.respondWith(staleWhileRevalidate(request)); return; }
  if (url.hostname === 'unpkg.com') { event.respondWith(staleWhileRevalidate(request)); return; }
  if (url.hostname.includes('tile.openstreetmap.org')) event.respondWith(staleWhileRevalidate(request));
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SYNC_NOW') {
    event.waitUntil(caches.open(CACHE_VERSION).then(cache => Promise.allSettled(APP_SHELL.map(url => fetch(url).then(r => { if (r && (r.ok || r.type === 'opaque')) return cache.put(url, r.clone()); })) )));
  }
});
