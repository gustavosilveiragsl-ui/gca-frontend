// Service worker do portal de solicitação (24/11/2026, item 4 da lista de 16/11: "Instalar o app").
// NÃO guarda nada em cache, de propósito: o portal sempre vem do servidor, então nunca volta uma versão velha
// (foi por isso que o sw.js antigo foi desligado). A única coisa que ele faz é mostrar uma página
// "Sem internet" quando a pessoa abre o app sem conexão, em vez do erro do navegador.
// Vale só para as páginas /solicitacao* (o registro limita o escopo); o sw.js antigo continua se removendo sozinho.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));

const SEM_INTERNET = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Sem internet</title>
<style>
:root{--bg:#f4f5f9;--surface:#fff;--fg:#0f172a;--fg-3:#475569;--line:#e2e8f0;--accent:#4f46e5;--accent-soft:#eef2ff;--accent-text:#4338ca}
@media (prefers-color-scheme: dark){:root{--bg:#0a0a0f;--surface:#0f0f17;--fg:#f1f5f9;--fg-3:#94a3b8;--line:#1e1e2e;--accent:#6366f1;--accent-soft:#1e1b4b;--accent-text:#a5b4fc;color-scheme:dark}}
*{box-sizing:border-box}
html,body{height:100%;margin:0}
body{background:var(--bg);color:var(--fg);font-family:-apple-system,'Segoe UI',Roboto,sans-serif;display:flex;align-items:center;justify-content:center;padding:24px 16px}
.caixa{max-width:380px;width:100%;background:var(--surface);border:1px solid var(--line);border-radius:16px;padding:28px 20px;display:flex;flex-direction:column;align-items:center;gap:14px;text-align:center}
.ic{width:64px;height:64px;border-radius:999px;background:var(--accent-soft);color:var(--accent-text);display:flex;align-items:center;justify-content:center}
h1{margin:0;font-size:21px}
p{margin:0;color:var(--fg-3);font-size:15px;line-height:1.5}
button{height:50px;width:100%;border:none;border-radius:12px;background:var(--accent);color:#fff;font:inherit;font-size:16px;font-weight:700;cursor:pointer}
</style></head><body><main class="caixa">
<span class="ic"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20h.01"/><path d="M8.5 16.43a5 5 0 0 1 7 0"/><path d="M5 12.86a10 10 0 0 1 5.17-2.69"/><path d="M19 12.86a10 10 0 0 0-2-1.43"/><path d="M2 8.82a15 15 0 0 1 4.18-2.65"/><path d="M22 8.82a15 15 0 0 0-11.29-3.76"/><path d="m2 2 20 20"/></svg></span>
<h1>Sem internet</h1>
<p>O portal precisa de internet para pedir e acompanhar o material. Confira o Wi-Fi ou os dados móveis e tente de novo.</p>
<button type="button" onclick="location.reload()">Tentar de novo</button>
</main></body></html>`;

self.addEventListener('fetch', (e) => {
  if (e.request.mode !== 'navigate') return;   // o resto (servidor, imagens, fontes) segue direto, sem passar por aqui
  e.respondWith(fetch(e.request).catch(() => new Response(SEM_INTERNET, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } })));
});
