// Estado da leitura: versão, livro e capítulo abertos, e o texto exibido.
// Fica fora dos componentes (estado único compartilhado por todo o app).
import { computed, ref, shallowRef, watch } from "vue";
import LIVROS from "../dados/livros.json";

export { LIVROS };

export const VERSOES = [
  { sigla: "ARA", nome: "Almeida Revista e Atualizada" },
  { sigla: "NVI", nome: "Nova Versão Internacional" },
  { sigla: "NVT", nome: "Nova Versão Transformadora" },
];

/** Índice do primeiro livro do Novo Testamento (Mateus). */
export const INICIO_NT = 39;

const ULTIMO_LIVRO = LIVROS.length - 1;

// ---------- estado salvo ----------

function lerSalvo() {
  try {
    return JSON.parse(localStorage.getItem("leitura")) ?? {};
  } catch {
    return {};
  }
}

function inteiroEntre(valor, min, max) {
  return Number.isInteger(valor) && valor >= min && valor <= max ? valor : min;
}

const salvo = lerSalvo();
const versao = ref(VERSOES.some((v) => v.sigla === salvo.versao) ? salvo.versao : "NVT");
const livroId = ref(inteiroEntre(salvo.livro, 0, ULTIMO_LIVRO));
const capituloId = ref(inteiroEntre(salvo.capitulo, 0, LIVROS[livroId.value].capitulos - 1));

// ---------- carregamento do texto ----------

/** Capítulo efetivamente exibido (só muda quando o novo texto chega). */
const exibido = shallowRef(null);
const carregando = ref(false);
const erro = ref(false);

// Pequeno cache em memória dos últimos livros abertos (o resto fica no service worker).
const cacheLivros = new Map();
const LIMITE_CACHE = 4;

function urlLivro(sigla, livro) {
  return `./biblia/${sigla}/${String(livro + 1).padStart(2, "0")}.json`;
}

function obterLivro(sigla, livro) {
  const chave = `${sigla}/${livro}`;
  let pedido = cacheLivros.get(chave);
  if (pedido) {
    cacheLivros.delete(chave); // reinsere no fim: "usado recentemente"
  } else {
    pedido = fetch(urlLivro(sigla, livro)).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    });
    pedido.catch(() => cacheLivros.delete(chave));
  }
  cacheLivros.set(chave, pedido);
  if (cacheLivros.size > LIMITE_CACHE) cacheLivros.delete(cacheLivros.keys().next().value);
  return pedido;
}

let ultimoPedido = 0;

async function carregar() {
  const id = ++ultimoPedido;
  const alvo = { versao: versao.value, livro: livroId.value, capitulo: capituloId.value };
  carregando.value = true;
  erro.value = false;
  try {
    const capitulos = await obterLivro(alvo.versao, alvo.livro);
    if (id !== ultimoPedido) return; // o usuário já pediu outro capítulo
    exibido.value = { ...alvo, versiculos: capitulos[alvo.capitulo] ?? [] };
  } catch {
    if (id === ultimoPedido) erro.value = true;
  } finally {
    if (id === ultimoPedido) carregando.value = false;
  }
}

watch(
  [versao, livroId, capituloId],
  () => {
    try {
      localStorage.setItem(
        "leitura",
        JSON.stringify({ versao: versao.value, livro: livroId.value, capitulo: capituloId.value })
      );
    } catch {}
    carregar();
  },
  { immediate: true }
);

// ---------- leitura offline ----------

// Pede ao service worker que baixe, em segundo plano, todos os livros da versão
// aberta. Assim a leitura continua funcionando sem internet, como no app antigo
// (que trazia tudo dentro do JS), mas sem atrasar a primeira tela.
const versoesBaixadas = new Set();

async function baixarVersaoParaOffline(sigla) {
  if (versoesBaixadas.has(sigla) || !("serviceWorker" in navigator)) return;
  if (navigator.connection?.saveData) return; // respeita o modo de economia de dados
  versoesBaixadas.add(sigla);
  const registro = await navigator.serviceWorker.ready;
  const base = new URL(document.baseURI);
  const urls = LIVROS.map((_, i) => new URL(urlLivro(sigla, i), base).href);
  registro.active?.postMessage({ tipo: "baixar", urls });
}

if (import.meta.env.PROD) {
  watch(versao, (sigla) => setTimeout(() => baixarVersaoParaOffline(sigla), 3000), {
    immediate: true,
  });
}

// ---------- navegação ----------

const livro = computed(() => LIVROS[livroId.value]);
const ehInicio = computed(() => livroId.value === 0 && capituloId.value === 0);
const ehFim = computed(
  () => livroId.value === ULTIMO_LIVRO && capituloId.value === livro.value.capitulos - 1
);

/** Posição anterior/seguinte, atravessando livros (Gênesis 50 → Êxodo 1). */
const anterior = computed(() => {
  if (capituloId.value > 0) return { livro: livroId.value, capitulo: capituloId.value - 1 };
  if (livroId.value > 0) {
    const l = livroId.value - 1;
    return { livro: l, capitulo: LIVROS[l].capitulos - 1 };
  }
  return null;
});

const seguinte = computed(() => {
  if (capituloId.value < livro.value.capitulos - 1)
    return { livro: livroId.value, capitulo: capituloId.value + 1 };
  if (livroId.value < ULTIMO_LIVRO) return { livro: livroId.value + 1, capitulo: 0 };
  return null;
});

/** Versículo a destacar quando o capítulo for exibido (vindo da busca). */
const versiculoAlvo = ref(null);

function irPara(posicao) {
  if (!posicao) return;
  livroId.value = posicao.livro;
  capituloId.value = posicao.capitulo;
}

export function referencia(posicao) {
  return posicao ? `${LIVROS[posicao.livro].nome} ${posicao.capitulo + 1}` : "";
}

export function useLeitura() {
  return {
    versao,
    livroId,
    capituloId,
    livro,
    exibido,
    carregando,
    erro,
    ehInicio,
    ehFim,
    anterior,
    seguinte,
    versiculoAlvo,
    recarregar: carregar,
    /** Abre o capítulo e rola até o versículo ({ livro, capitulo, versiculo }). */
    irParaVersiculo(r) {
      irPara(r);
      versiculoAlvo.value = { ...r };
    },
    selecionarVersao: (sigla) => (versao.value = sigla),
    selecionarLivro: (indice) => irPara({ livro: indice, capitulo: 0 }),
    selecionarCapitulo: (indice) => (capituloId.value = indice),
    voltar: () => irPara(anterior.value),
    avancar: () => irPara(seguinte.value),
  };
}
