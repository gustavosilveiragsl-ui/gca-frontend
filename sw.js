// GCA Solicitação — Service Worker
const CACHE_NAME = 'gca-sol-v1';

// Arquivos para cache offline (shell do app)
const CACHE_URLS = [
  '/gca-frontend/solicitacao.html',
  '/gca-frontend/manifest.json',
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap',
];

// Instala e faz cache dos arquivos essenciais
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(CACHE_URLS).catch(() => {
        // Ignora erros de cache (ex: fontes externas bloqueadas)
      });
    })
  );
});

// Ativa e limpa caches antigos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Estratégia: Network First para API, Cache First para assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Requisições para o backend Railway — sempre network (sem cache)
  if (url.hostname.includes('railway.app')) {
    return; // deixa o browser tratar normalmente
  }

  // Para o HTML principal — Network First (sempre tenta buscar atualizado)
  if (url.pathname.endsWith('solicitacao.html')) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Para outros assets — Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      });
    }).catch(() => caches.match('/gca-frontend/solicitacao.html'))
  );
});
