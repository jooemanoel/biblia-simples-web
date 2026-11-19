// Service worker: permite instalar o app e ler sem internet.
//
// Dois caches:
//   - APP:    página, JS, CSS e ícones. Apagado a cada nova VERSAO.
//   - TEXTOS: os livros da Bíblia (public/biblia/...). Só muda quando o texto
//             muda; troque TEXTOS apenas se regerar os dados (npm run dados).
//
// Estratégias:
//   - Navegação: REDE PRIMEIRO (com limite de 3 s), cache como reserva.
//     Online, você sempre recebe a versão mais recente do app.
//   - Demais arquivos: CACHE PRIMEIRO. O Vite põe hash no nome dos arquivos
//     (index-Bx12.js), então um arquivo com o mesmo nome nunca muda.

const VERSAO = "biblia-app-v1";
const TEXTOS = "biblia-textos-v1";

const ARQUIVOS_INICIAIS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./favicon.svg",
  "./icones/icone-192.png",
  "./icones/icone-512.png",
];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(VERSAO).then((cache) => cache.addAll(ARQUIVOS_INICIAIS)));
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((nomes) =>
        Promise.all(
          nomes.filter((n) => n !== VERSAO && n !== TEXTOS).map((n) => caches.delete(n))
        )
      )
  );
  self.clients.claim();
});

// O app pede para baixar uma versão inteira em segundo plano (leitura offline).
self.addEventListener("message", (evento) => {
  if (evento.data?.tipo === "baixar") evento.waitUntil(baixarEmSegundoPlano(evento.data.urls));
});

self.addEventListener("fetch", (evento) => {
  const requisicao = evento.request;
  if (requisicao.method !== "GET") return;
  const url = new URL(requisicao.url);
  if (url.origin !== self.location.origin) return;

  if (requisicao.mode === "navigate") {
    evento.respondWith(redePrimeiro(requisicao));
  } else {
    const nomeCache = url.pathname.includes("/biblia/") ? TEXTOS : VERSAO;
    evento.respondWith(cachePrimeiro(requisicao, nomeCache));
  }
});

async function redePrimeiro(requisicao) {
  const cache = await caches.open(VERSAO);
  try {
    const resposta = await Promise.race([
      fetch(requisicao),
      new Promise((_, falhar) => setTimeout(() => falhar(new Error("tempo esgotado")), 3000)),
    ]);
    if (resposta.ok) cache.put("./index.html", resposta.clone());
    return resposta;
  } catch (erro) {
    const salva = await cache.match("./index.html");
    if (salva) return salva;
    return fetch(requisicao);
  }
}

async function cachePrimeiro(requisicao, nomeCache) {
  const cache = await caches.open(nomeCache);
  const salva = await cache.match(requisicao);
  if (salva) return salva;

  const resposta = await fetch(requisicao);
  if (resposta.ok) cache.put(requisicao, resposta.clone());
  return resposta;
}

async function baixarEmSegundoPlano(urls) {
  const cache = await caches.open(TEXTOS);
  for (const url of urls) {
    if (await cache.match(url)) continue;
    try {
      await cache.add(url);
    } catch {
      return; // sem rede: tenta de novo na próxima abertura do app
    }
  }
}
