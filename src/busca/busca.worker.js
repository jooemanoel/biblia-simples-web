// Web Worker da busca: carrega todos os livros de uma versão e procura o termo
// fora da thread principal, para a tela não travar enquanto ~31 mil versículos
// são examinados. Os livros vêm do cache do service worker quando já baixados.
import { marcarOcorrencias, normalizar } from "./normalizar.js";

const TOTAL_LIVROS = 66;

let base = ""; //          URL base do app (o worker fica em /assets/, então precisa dela)
let versaoAtual = null; // sigla da versão indexada (ou em carregamento)
let pronto = null; //      Promise do índice da versão atual

// Índice: um item por versículo, em ordem bíblica.
let textos = [];
let normas = [];
let refs = []; // [livro, capitulo, versiculo] (base 0)

// Resultado da última busca (posições no índice), para paginar sem refazer.
let ultimoTermo = null;
let encontrados = [];

function urlLivro(sigla, livro) {
  return new URL(`biblia/${sigla}/${String(livro + 1).padStart(2, "0")}.json`, base).href;
}

function carregar(sigla) {
  if (sigla === versaoAtual && pronto) return pronto;
  versaoAtual = sigla;
  ultimoTermo = null;
  let carregados = 0;

  pronto = Promise.all(
    Array.from({ length: TOTAL_LIVROS }, (_, livro) =>
      fetch(urlLivro(sigla, livro))
        .then((r) => {
          if (!r.ok) throw new Error(`HTTP ${r.status}`);
          return r.json();
        })
        .then((capitulos) => {
          if (sigla === versaoAtual) {
            postMessage({ tipo: "progresso", versao: sigla, carregados: ++carregados, total: TOTAL_LIVROS });
          }
          return capitulos;
        })
    )
  ).then((livros) => {
    if (sigla !== versaoAtual) return; // outra versão foi pedida no meio do caminho
    textos = [];
    normas = [];
    refs = [];
    livros.forEach((capitulos, l) =>
      capitulos.forEach((versiculos, c) =>
        versiculos.forEach((texto, v) => {
          textos.push(texto);
          normas.push(normalizar(texto));
          refs.push([l, c, v]);
        })
      )
    );
    postMessage({ tipo: "pronto", versao: sigla, versiculos: textos.length });
  });

  pronto.catch(() => {
    if (sigla === versaoAtual) {
      pronto = null; // permite tentar de novo
      postMessage({ tipo: "erro", versao: sigla });
    }
  });
  return pronto;
}

async function buscar({ id, versao, termo, inicio, quantidade }) {
  await carregar(versao);
  if (versao !== versaoAtual) return;

  const t = normalizar(termo);
  if (t !== ultimoTermo) {
    ultimoTermo = t;
    encontrados = [];
    if (t) for (let i = 0; i < normas.length; i++) if (normas[i].includes(t)) encontrados.push(i);
  }

  const itens = encontrados.slice(inicio, inicio + quantidade).map((i) => {
    const [livro, capitulo, versiculo] = refs[i];
    return { livro, capitulo, versiculo, partes: marcarOcorrencias(textos[i], t) };
  });
  postMessage({ tipo: "resultado", id, total: encontrados.length, inicio, itens });
}

onmessage = ({ data }) => {
  if (data.tipo === "iniciar") {
    base = data.base;
    carregar(data.versao).catch(() => {});
  } else if (data.tipo === "buscar") {
    buscar(data).catch(() => {});
  }
};
