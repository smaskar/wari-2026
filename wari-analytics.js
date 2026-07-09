/* Wari usage analytics — anonymous, self-hosted, offline-safe.
   Sends ONE tiny "app opened" ping per device per day to /api/hit on our OWN server
   (same-origin → no CSP change, no third party, no personal data, no IP in the hit log).
   - random local install id (localStorage) → lets the server count UNIQUE users
   - throttled to once/calendar-day/device → clean daily-active + unique-user metrics
   - offline: the ping is queued in localStorage and flushed on the next online event/open
   - fully wrapped in try/catch and fire-and-forget → can NEVER break the app or block offline use.
   Endpoint contract (server just logs these query params and returns 204):
     GET /api/hit?u=<installId>&d=<YYYY-MM-DD>&v=<appVersion> */
(function () {
  try {
    var UID = 'wariUid', QUEUE = 'wariHitQueue', LAST = 'wariHitLast', VER = '156';
    function store(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    function uid() {
      var u = store(UID);
      if (!u) { u = Date.now().toString(36) + Math.random().toString(36).slice(2, 10); put(UID, u); }
      return u;
    }
    function today() {
      var d = new Date();
      return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
    }
    function url(hit) {
      return '/api/hit?u=' + encodeURIComponent(hit.u) + '&d=' + encodeURIComponent(hit.d) +
             '&v=' + encodeURIComponent(hit.v || VER);
    }
    function send(hit) {
      try {
        var u = url(hit);
        if (navigator.sendBeacon) { navigator.sendBeacon(u); return true; }
        fetch(u, { method: 'GET', keepalive: true, cache: 'no-store', mode: 'no-cors' }).catch(function () {});
        return true;
      } catch (e) { return false; }
    }
    function readQueue() { try { return JSON.parse(store(QUEUE) || '[]'); } catch (e) { return []; } }
    function flush() {
      if (!navigator.onLine) return;
      var q = readQueue(); if (!q.length) return;
      q.forEach(function (hit) { send(hit); });   // fire-and-forget; keep last 200 only if any remain
      put(QUEUE, '[]');
    }
    function record() {
      var d = today();
      if (store(LAST) === d) return;               // already counted this device today
      var hit = { u: uid(), d: d, v: VER };
      put(LAST, d);
      if (navigator.onLine && send(hit)) return;
      var q = readQueue(); q.push(hit); put(QUEUE, JSON.stringify(q.slice(-200)));  // offline → queue
    }
    window.addEventListener('online', flush);
    function go() { flush(); record(); }
    if (document.readyState !== 'loading') go();
    else document.addEventListener('DOMContentLoaded', go);
  } catch (e) { /* analytics must never break the app */ }
})();
