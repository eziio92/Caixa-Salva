// Service worker: abre o app sem internet e entrega o lembrete como arquivo de calendário (.ics).
// Estratégia: tenta a rede primeiro (para receber atualizações) e usa o cache se estiver offline.
// A rede é sempre consultada de novo ("no-cache"): o GitHub Pages deixa o navegador reutilizar a página por até
// 10 minutos, e abrir o app logo antes da publicação terminar prendia a versão velha durante esse tempo.
// Ao publicar uma nova versão do app, basta mudar o número abaixo.
const CACHE = 'caixa-salva-v4';
const ASSETS = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', (e) => {
  // 'reload' ignora o cache HTTP do navegador, para não guardar uma cópia velha dos arquivos
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' })))));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// O app monta o texto do lembrete e o passa no endereço; aqui ele volta como um arquivo .ics de verdade,
// sem sair do aparelho, para o iPhone oferecer "Adicionar ao Calendário".
function icsResponse(c) {
  try {
    const bin = atob((c || '').replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
    return new Response(bytes, {
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': 'inline; filename="lembrete.ics"',
        'Cache-Control': 'no-store'
      }
    });
  } catch (err) {
    return new Response('Lembrete inválido', { status: 400 });
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/lembrete.ics')) {
    e.respondWith(icsResponse(url.searchParams.get('c')));
    return;
  }

  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      })
      .catch(() => caches.match(req).then((m) => m || caches.match('./index.html')))
  );
});
