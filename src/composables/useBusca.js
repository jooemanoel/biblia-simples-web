// Estado da busca textual. O termo e os resultados ficam guardados enquanto o app
// está aberto: ao voltar à busca depois de abrir um versículo, a lista continua lá.
import { ref, shallowRef, watch } from "vue";
import { useLeitura } from "./useLeitura.js";

const POR_PAGINA = 100;
export const TAMANHO_MINIMO = 2;

const termo = ref("");
const itens = shallowRef([]);
const total = ref(0);
const buscando = ref(false);
/** Carregamento do texto da versão: { carregados, total } ou null quando pronto. */
const progresso = ref(null);
const erro = ref(false);

let worker = null;
let ultimoId = 0;
let espera = null;

const { versao } = useLeitura();

function obterWorker() {
  if (worker) return worker;
  worker = new Worker(new URL("../busca/busca.worker.js", import.meta.url), { type: "module" });
  worker.onmessage = ({ data }) => {
    if (data.versao && data.versao !== versao.value) return;
    if (data.tipo === "progresso") {
      progresso.value = { carregados: data.carregados, total: data.total };
    } else if (data.tipo === "pronto") {
      progresso.value = null;
    } else if (data.tipo === "erro") {
      progresso.value = null;
      buscando.value = false;
      erro.value = true;
    } else if (data.tipo === "resultado" && data.id === ultimoId) {
      itens.value = data.inicio === 0 ? data.itens : [...itens.value, ...data.itens];
      total.value = data.total;
      buscando.value = false;
    }
  };
  return worker;
}

/** Começa a carregar o texto da versão atual (chamado ao abrir a janela de busca). */
function preparar() {
  erro.value = false;
  obterWorker().postMessage({ tipo: "iniciar", versao: versao.value, base: document.baseURI });
}

function pedir(inicio) {
  const t = termo.value.trim();
  if (t.length < TAMANHO_MINIMO) {
    ultimoId++; // descarta respostas pendentes
    itens.value = [];
    total.value = 0;
    buscando.value = false;
    return;
  }
  erro.value = false;
  buscando.value = true;
  obterWorker().postMessage({
    tipo: "buscar",
    id: ++ultimoId,
    versao: versao.value,
    termo: t,
    inicio,
    quantidade: POR_PAGINA,
  });
}

/** Busca com um pequeno atraso enquanto o usuário digita. */
function buscarAoDigitar() {
  clearTimeout(espera);
  // Já indica "Buscando…" durante a espera, em vez de "Nenhum versículo encontrado".
  if (termo.value.trim().length >= TAMANHO_MINIMO) buscando.value = true;
  espera = setTimeout(() => pedir(0), 250);
}

function buscarAgora() {
  clearTimeout(espera);
  pedir(0);
}

function carregarMais() {
  pedir(itens.value.length);
}

// Trocou a versão: refaz a busca no novo texto (se o worker já existe).
watch(versao, () => {
  if (!worker) return;
  preparar();
  if (termo.value.trim().length >= TAMANHO_MINIMO) buscarAgora();
});

export function useBusca() {
  return {
    termo,
    itens,
    total,
    buscando,
    progresso,
    erro,
    preparar,
    buscarAoDigitar,
    buscarAgora,
    carregarMais,
  };
}
