/* Service worker do Ball Fighting Arena (PWA).
   Cache versionado: mudar o nome CACHE forca a atualizacao do app instalado.
   Estrategia: HTML = rede primeiro (mostra a versao nova), assets = cache primeiro (rapido + offline). */
const CACHE = 'bfa-2026-07-07a';
const ASSETS = [
  './', './index.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png',
  './icon-192-maskable.png', './icon-512-maskable.png', './icon-1024.png',
  './assets/loading_bg.jpg', './assets/arena_btn.jpg', './assets/vs_btn.jpg', './assets/adv_btn.jpg',
  './assets/sfx/rifle.mp3', './assets/sfx/dogbite.mp3', './assets/sfx/punch.mp3',
  './assets/sfx/kick.mp3', './assets/sfx/katana.mp3', './assets/sfx/sniper.mp3'
];

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {})));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // Google Fonts etc. passam direto

  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');
  if (isHTML) {
    // rede primeiro -> garante que a versao nova aparece; cai no cache se offline
    e.respondWith(
      fetch(req).then(r => { const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r; })
        .catch(() => caches.match(req).then(m => m || caches.match('./index.html')))
    );
    return;
  }
  // imagens/sons: cache primeiro; se nao tiver, busca na rede e guarda
  e.respondWith(
    caches.match(req).then(m => m || fetch(req).then(r => {
      const cp = r.clone(); caches.open(CACHE).then(c => c.put(req, cp)); return r;
    }))
  );
});
