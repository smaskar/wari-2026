/* Wari usage analytics — anonymous, self-hosted, offline-safe.
   Beacons go to /api/hit on our OWN server (same-origin, no third party). Anonymous: a random
   local install id + non-identifying context. NO name, NO IP, NO precise GPS stored.
   Event types (param e):
     (open)  app opened            fields: s,tz,lang,pwa,dpr,v
     call    tapped a phone number fields: k = 108 | 112 | 102 | contact
     loc     coarse area (nearest mukkam, only when the user already uses location/mukkam)
             fields: near = nearest halt/town name
     dir     tapped directions;  share = tapped share
   Offline: every beacon is queued in localStorage and flushed when back online (time preserved).
   Fully try/catch'd + fire-and-forget → can NEVER break the app or block offline use. */
(function () {
  try {
    var UID = 'wariUid', QUEUE = 'wariHitQueue', VER = '169', locSent = false;
    function store(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
    function put(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
    function uid() {
      var u = store(UID);
      if (!u) { u = Date.now().toString(36) + Math.random().toString(36).slice(2, 10); put(UID, u); }
      return u;
    }
    function pwa() { try { return ((window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone) ? 1 : 0; } catch (e) { return 0; } }
    function readQ() { try { return JSON.parse(store(QUEUE) || '[]'); } catch (e) { return []; } }
    // Send one beacon. params is a plain object; u/t/v are filled in (t preserved if already set).
    function send(p) {
      try {
        p.u = uid(); if (!p.t) p.t = Date.now(); p.v = VER;
        var qs = Object.keys(p).map(function (k) { return k + '=' + encodeURIComponent(p[k]); }).join('&');
        var u = '/api/hit?' + qs;
        if (navigator.sendBeacon) { navigator.sendBeacon(u); return true; }
        fetch(u, { method: 'GET', keepalive: true, cache: 'no-store', mode: 'no-cors' }).catch(function () {});
        return true;
      } catch (e) { return false; }
    }
    function queue(p) { var q = readQ(); q.push(p); put(QUEUE, JSON.stringify(q.slice(-400))); }
    function fire(p) { if (navigator.onLine && send(p)) return; queue(p); }
    function flush() { if (!navigator.onLine) return; var q = readQ(); if (!q.length) return; q.forEach(send); put(QUEUE, '[]'); }

    function openBeacon() {
      var sw = 0, sh = 0, dpr = 1;
      try { sw = screen.width; sh = screen.height; dpr = window.devicePixelRatio || 1; } catch (e) {}
      fire({ s: sw + 'x' + sh, tz: (new Date().getTimezoneOffset() * -1), lang: (navigator.language || ''), pwa: pwa(), dpr: (Math.round(dpr * 100) / 100) });
    }

    // Public: track an interaction event. e.g. wariTrack('dir'), wariTrack('call',{k:'108'})
    window.wariTrack = function (ev, props) { try { var p = props ? JSON.parse(JSON.stringify(props)) : {}; p.e = ev; fire(p); } catch (e) {} };

    // Auto-track phone-number taps (the real "did it help" signal).
    document.addEventListener('click', function (e) {
      try {
        var a = e.target && e.target.closest ? e.target.closest('a[href^="tel:"]') : null;
        if (!a) return;
        var num = (a.getAttribute('href') || '').replace('tel:', '').replace(/[^0-9]/g, '');
        var k = num === '108' ? '108' : num === '112' ? '112' : num === '102' ? '102' : 'contact';
        window.wariTrack('call', { k: k });
      } catch (_) {}
    }, true);

    // Coarse location = nearest mukkam/town. Sent at most once per open, and ONLY when the user
    // already granted location or actively used a mukkam — never a precise GPS point, never stored raw.
    function nearestMukkam(lat, lng) {
      try {
        var pts = window.WARI_MUKKAMS || []; if (!pts.length) return '';
        var best = '', bd = Infinity, R = 6371;
        for (var i = 0; i < pts.length; i++) {
          var m = pts[i]; if (!isFinite(m.lat) || !isFinite(m.lng)) continue;
          var dLa = (m.lat - lat) * Math.PI / 180, dLo = (m.lng - lng) * Math.PI / 180;
          var x = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(lat * Math.PI / 180) * Math.cos(m.lat * Math.PI / 180) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
          var d = 2 * R * Math.asin(Math.sqrt(x));
          if (d < bd) { bd = d; best = m.n || ''; }
        }
        return best;
      } catch (e) { return ''; }
    }
    // Public: app calls this when it has the user's coords (near-me / mukkam tap).
    window.wariLoc = function (lat, lng) {
      try { if (locSent || !isFinite(lat) || !isFinite(lng)) return; var near = nearestMukkam(lat, lng); if (near) { locSent = true; fire({ e: 'loc', near: near }); } } catch (e) {}
    };
    // If location was ALREADY granted (no new prompt), capture coarse area on open.
    function silentLoc() {
      try {
        if (!navigator.geolocation || !navigator.permissions || !navigator.permissions.query) return;
        navigator.permissions.query({ name: 'geolocation' }).then(function (st) {
          if (st.state !== 'granted') return;
          navigator.geolocation.getCurrentPosition(function (pos) { window.wariLoc(pos.coords.latitude, pos.coords.longitude); }, function () {}, { maximumAge: 600000, timeout: 8000, enableHighAccuracy: false });
        }).catch(function () {});
      } catch (e) {}
    }

    window.addEventListener('online', flush);
    function go() { flush(); openBeacon(); setTimeout(silentLoc, 3000); }
    if (document.readyState !== 'loading') go();
    else document.addEventListener('DOMContentLoaded', go);
  } catch (e) { /* analytics must never break the app */ }
})();
