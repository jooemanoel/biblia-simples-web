// Divide cada versão da Bíblia em um arquivo por livro.
//
// No projeto Angular as três versões (12 MB) eram importadas dentro do JS
// principal: era preciso baixar tudo antes de ver o primeiro versículo.
// Aqui o app baixa só o livro aberto (Gênesis NVT ≈ 200 KB, ou ≈ 60 KB compactado),
// e o service worker guarda o restante da versão em segundo plano para uso offline.
//
// Uso: npm run dados [pasta-de-origem]
//   sem pasta: baixa ARA.json, NVI.json e NVT.json de inst/json no repositório
//   damarals/biblias (https://github.com/damarals/biblias)
//   com pasta: lê os mesmos arquivos dessa pasta (ex.: um clone do damarals/biblias)
//
// Gera:
//   public/biblia/<VERSAO>/<01..66>.json  -> capítulos do livro (string[][])
//   src/dados/livros.json                 -> nome, abreviação e nº de capítulos
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const PASTA_LOCAL = process.argv[2];
const URL_ORIGEM = "https://raw.githubusercontent.com/damarals/biblias/main/inst/json";
const VERSOES = ["ARA", "NVI", "NVT"];

async function lerVersao(versao) {
  if (PASTA_LOCAL) return readFileSync(join(PASTA_LOCAL, `${versao}.json`), "utf8");

  const url = `${URL_ORIGEM}/${versao}.json`;
  const resposta = await fetch(url);
  if (!resposta.ok) throw new Error(`Falha ao baixar ${url} (HTTP ${resposta.status})`);
  return resposta.text();
}

console.log(`origem: ${PASTA_LOCAL ?? URL_ORIGEM}`);

let indice = null;

for (const versao of VERSOES) {
  const texto = (await lerVersao(versao)).replace(/^﻿/, "");
  const livros = JSON.parse(texto);
  const pasta = join("public", "biblia", versao);
  mkdirSync(pasta, { recursive: true });

  corrigirOrigem(versao, livros);

  livros.forEach((livro, i) => {
    const arquivo = join(pasta, `${String(i + 1).padStart(2, "0")}.json`);
    const capitulos = livro.chapters.map((versiculos, c) =>
      versiculos.map((v, n) => {
        if (typeof v === "string") return v.trim();
        console.warn(`aviso: ${versao} ${livro.name} ${c + 1}:${n + 1} não é texto; unindo partes`);
        return [v].flat().join(" ").trim();
      })
    );
    writeFileSync(arquivo, JSON.stringify(capitulos));
  });

  const atual = livros.map((l) => ({ nome: l.name, abrev: l.abbrev, capitulos: l.chapters.length }));
  if (!indice) indice = atual;
  else if (JSON.stringify(indice) !== JSON.stringify(atual)) {
    console.warn(`aviso: a estrutura de livros da versão ${versao} difere da primeira versão`);
  }
  console.log(`${versao}: ${livros.length} livros gravados em ${pasta}`);
}

// Erros conhecidos nos arquivos de origem.
function corrigirOrigem(versao, livros) {
  // NVT, Salmos 119: o versículo 130 veio "grudado" no 13 (lista com dois textos),
  // e o capítulo ficou com 175 versículos em vez de 176.
  const sl119 = livros[18]?.chapters[118];
  if (versao === "NVT" && sl119?.length === 175 && Array.isArray(sl119[12])) {
    const [v13, v130] = sl119[12];
    sl119[12] = v13;
    sl119.splice(129, 0, v130);
    console.log("corrigido: NVT Salmos 119:13 e 119:130");
  }
}

mkdirSync(join("src", "dados"), { recursive: true });
writeFileSync(join("src", "dados", "livros.json"), JSON.stringify(indice, null, 1));
console.log("índice gravado em src/dados/livros.json");
