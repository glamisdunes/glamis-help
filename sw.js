/* Offline support: the site keeps working with a weak signal in the dunes.
   Pages and the encrypted bundle are network-first (fresh when online, cached when not); fonts and images are cache-first. */
var CACHE = 'gdrh-b555adecec';
var CORE = ['./', 'index.html', 'app.css?v=b555adecec', 'app.js?v=b555adecec', 'fflate.min.js?v=b555adecec', 'site.dat?v=b555adecec',
  'assets/img/logo-600.png', 'assets/img/logo-240.png', 'assets/img/utv-sand.png'];
self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  var url = new URL(req.url);
  var cacheFirst = /\/assets\//.test(url.pathname);
  if (cacheFirst) {
    e.respondWith(caches.match(req).then(function (hit) {
      return hit || fetch(req).then(function (r) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); return r; });
    }));
    return;
  }
  e.respondWith(fetch(req).then(function (r) {
    if (r.ok) { var cp = r.clone(); caches.open(CACHE).then(function (c) { c.put(req, cp); }); }
    return r;
  }).catch(function () { return caches.match(req, { ignoreSearch: /site\.dat/.test(url.pathname) }).then(function (hit) { return hit || caches.match('index.html'); }); }));
});
