/* Wari usage analytics — anonymous, self-hosted, offline-safe.
   Sends ONE beacon on EVERY app open to /api/hit on our OWN server (same-origin → no CSP change,
   no third party). Anonymous: a random local install id (for unique-user counts) + non-identifying
   device context. NO name, NO IP (the server is told not to log IP), NO precise location.
   Captured per open:
     u   = random install id (unique users)          t    = open time (epoch ms, client)
     s   = screen WxH (device size)                   tz   = timezone offset minutes (+330 = IST)
     lang= browser language                           pwa  = 1 if launched as installed app
     dpr = device pixel ratio                         v    = app version
   The browser + device + OS come from the User-Agent, which the server logs itself.
   Offline: every open is queued in localStorage and flushed when back online (open time preserved).
   Fully try/catch'd + fire-and-forget → can NEVER break the app or block offline use. */
(function () {
  try {
    var UID = 'wariUid', QUEUE = 'wariHitQueue', VER = '159';
    function store(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    function uid() {
      var u = store(UID);
      if (!u) { u = Date.now().toString(36) + Math.random().toString(36).slice(2, 10); put(UID, u); }
      return u;
    }
    function pwa() {
      try { return ((window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone) ? 1 : 0; }
      catch (e) { return 0; }
    }
    function url(h) {
      return '/api/hit?u=' + encodeURIComponent(h.u) + '&t=' + h.t +
             '&s=' + encodeURIComponent(h.s) + '&tz=' + h.tz +
             '&lang=' + encodeURIComponent(h.lang) + '&pwa=' + h.pwa +
             '&dpr=' + h.dpr + '&v=' + encodeURIComponent(h.v);
    }
    function send(h) {
      try {
        var u = url(h);
        if (navigator.sendBeacon) { navigator.sendBeacon(u); return true; }
        fetch(u, { method: 'GET', keepalive: true, cache: 'no-store', mode: 'no-cors' }).catch(function () {});
        return true;
      } catch (e) { return false; }
    }
    function readQ() { try { return JSON.parse(store(QUEUE) || '[]'); } catch (e) { return []; } }
    function flush() {
      if (!navigator.onLine) return;
      var q = readQ(); if (!q.length) return;
      q.forEach(function (h) { send(h); });
      put(QUEUE, '[]');
    }
    function hit() {
      var sw = 0, sh = 0, dpr = 1;
      try { sw = screen.width; sh = screen.height; dpr = window.devicePixelRatio || 1; } catch (e) {}
      return {
        u: uid(), t: Date.now(), s: sw + 'x' + sh,
        tz: (new Date().getTimezoneOffset() * -1),
        lang: (navigator.language || ''), pwa: pwa(),
        dpr: (Math.round(dpr * 100) / 100), v: VER
      };
    }
    function record() {                              // EVERY open (no throttle)
      var h = hit();
      if (navigator.onLine && send(h)) return;
      var q = readQ(); q.push(h); put(QUEUE, JSON.stringify(q.slice(-300)));   // offline → queue
    }
    window.addEventListener('online', flush);
    function go() { flush(); record(); }
    if (document.readyState !== 'loading') go();
    else document.addEventListener('DOMContentLoaded', go);
  } catch (e) { /* analytics must never break the app */ }
})();
