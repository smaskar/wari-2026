const CACHE_VERSION = 'wari2026-v163';
const TILE_CACHE = 'wari-tiles-v3'; // separate + persistent: survives app-version bumps so the
                                     // offline map tiles are NOT re-downloaded on each update.
                                     // (v3: purges v2, which may hold OSM "Access blocked" images
                                     //  cached during the old OSM-fallback era. Now local-only.)
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
  './wari-routes-full.js',
  './wari-points-tukaram-halts.js',
  './wari-points-satara.js',
  './wari-points-hirkani.js',
  './wari-points-private.js',
  './wari-points-solapur.js',
  './wari-points-water-solapur.js',
  './wari-points-toilets.js',
  './wari-points-police.js',
  './wari-points-charanseva.js',
  './wari-points-water-filling.js',
  './wari-points-amb-supplement.js',
  './wari-points-phc102.js',
  './wari-points-mrsac.js',
  './wari-points-icu.js',
  './wari-points-dho-mo.js',
  './assets/img/brand-2c-emblem.png',
  './assets/img/brand-2c-tagline.png',
  './assets/img/brand-2c-pill.png',
  './assets/img/brand-2c-charanseva.png',
  './wari-points-visava.js',
  './wari-points-mymaps.js',
  './wari-points-memsbook.js',
  './wari-ambulance-contacts-2026.js',
  './wari-mukkams.js',
  './wari-officials.js',
  './wari-dignitaries.js',
  './wari-clips.js',
  './wari-analytics.js',
  './assets/img/hirkani-booth.jpg',
  './assets/img/brand-deity-full.png',
  './assets/img/emblem-crop.png',
  './assets/img/icon-192.png',
  './assets/img/facility/phaltan-sdh.jpg',
  './assets/img/facility/taradgaon-phc.jpg',
  './assets/img/facility/lonand-phc.jpg',
  './assets/img/leaders/pm-modi.jpg',
  './assets/img/leaders/l1.jpg',
  './assets/img/leaders/l2.jpg',
  './assets/img/leaders/l3.jpg',
  './assets/img/leaders/l4.jpg',
  './assets/img/leaders/l5.jpg',
  // Leaflet is now bundled locally (was unpkg CDN) so the map engine works with no network
  // and on government networks that block external CDNs.
  './assets/vendor/leaflet/leaflet.css',
  './assets/vendor/leaflet/leaflet.js',
  './assets/vendor/leaflet/images/marker-icon.png',
  './assets/vendor/leaflet/images/marker-icon-2x.png',
  './assets/vendor/leaflet/images/marker-shadow.png',
  './assets/vendor/leaflet/images/layers.png',
  './assets/vendor/leaflet/images/layers-2x.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_VERSION).then(cache => Promise.allSettled(APP_SHELL.map(url => cache.add(url)))));
});

self.addEventListener('activate', event => {
  // Drop OLD app-shell caches (wari2026-vNNN) and STALE tile caches (wari-tiles-*, e.g. the
  // poisoned v1). Keep only the current TILE_CACHE so the offline map isn't re-downloaded.
  event.waitUntil(caches.keys().then(keys => Promise.all(
    keys.filter(k => (k.startsWith('wari2026-v') && k !== CACHE_VERSION) || (k.startsWith('wari-tiles-') && k !== TILE_CACHE)).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});

function isDataOrAppRequest(url) {
  return url.pathname.endsWith('.html') || url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.webmanifest') || url.pathname.includes('wari-points-') || url.pathname.includes('wari-data');
}

// Map tiles are now BUNDLED locally at ./assets/tiles/{z}/{x}/{y}.png (served by our own
// server — no external CDN, works on locked-down govt networks). A tile request is either a
// local bundled tile or (legacy / off-corridor) a direct OSM URL.
function isLocalTile(url) {
  return url.origin === location.origin && url.pathname.includes('/assets/tiles/');
}
function isOsmTile(url) {
  return url.hostname.includes('tile.openstreetmap.org');
}
// Resolve a tile from the BUNDLED local set ONLY — never OSM. This makes the app fully
// self-contained (works on CDN-blocked govt networks and offline) and, critically, guarantees
// OSM's "Access blocked" tile can NEVER appear (OSM sometimes serves that as HTTP 200, so an
// r.ok check can't filter it — the only safe answer is to not call OSM at runtime at all).
// A tile with no local file renders blank (transparent errorTileUrl); the map's zoom/bounds are
// constrained to the bundled area so users don't pan into blank space.
async function fetchTile(request) {
  const url = new URL(request.url);
  try { const r = await fetch(request); if (r && r.ok) return r; } catch (e) {}
  return null;
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

// Tiles never change → cache-first (saves data + works offline), fill on a miss.
async function tileCacheFirst(request) {
  const cache = await caches.open(TILE_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetchTile(request);
  if (response) { cache.put(request, response.clone()); return response; }
  return cached || Response.error();
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (isLocalTile(url) || isOsmTile(url)) { event.respondWith(tileCacheFirst(request)); return; }
  if (request.mode === 'navigate') { event.respondWith(networkFirst(request)); return; }
  if (url.origin === location.origin && isDataOrAppRequest(url)) { event.respondWith(networkFirst(request)); return; }
});

// Background bulk download of route-corridor tiles for full offline maps.
async function precacheTiles(urls) {
  const cache = await caches.open(TILE_CACHE);
  const queue = urls.slice();
  let done = 0, total = urls.length;
  async function worker() {
    while (queue.length) {
      const u = queue.shift();
      try {
        if (!(await cache.match(u))) {
          const r = await fetchTile(new Request(u));
          if (r) await cache.put(u, r.clone());
        }
      } catch (e) { /* skip failed tile */ }
      done++;
      if (done % 40 === 0 || done === total) {
        const clients = await self.clients.matchAll();
        clients.forEach(c => c.postMessage({ type: 'TILES_PROGRESS', done, total }));
      }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker)); // 6 parallel downloads
  const clients = await self.clients.matchAll();
  clients.forEach(c => c.postMessage({ type: 'TILES_DONE', total }));
}

self.addEventListener('message', event => {
  if (!event.data) return;
  if (event.data.type === 'SYNC_NOW') {
    event.waitUntil(caches.open(CACHE_VERSION).then(cache => Promise.allSettled(APP_SHELL.map(url => fetch(url).then(r => { if (r && (r.ok || r.type === 'opaque')) return cache.put(url, r.clone()); })))));
  }
  if (event.data.type === 'PRECACHE_TILES' && Array.isArray(event.data.urls)) {
    event.waitUntil(precacheTiles(event.data.urls));
  }
});
