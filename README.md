# Bíblia Simples (Vue)

Leitura da Bíblia nas versões **ARA**, **NVI** e **NVT**, instalável como PWA e
disponível offline. Reescrita em Vue 3 + Vite da versão em Angular.

## Comandos

```bash
npm install
npm run dev       # desenvolvimento
npm run build     # gera docs/ (publicado pelo GitHub Pages)
npm run dados     # divide os JSON originais em um arquivo por livro (public/biblia)
npm run icones    # gera favicon e ícones do PWA (public/icones)
```

`npm run dados` lê, por padrão, `../biblia-simples/src/assets/{ARA,NVI,NVT}.json`;
outra pasta pode ser passada como argumento: `npm run dados -- caminho/da/pasta`.

## Estrutura

```
public/biblia/<VERSAO>/<01..66>.json   texto de cada livro (string[][])
public/sw.js                           service worker (cache offline)
src/dados/livros.json                  nomes e nº de capítulos (comum às 3 versões)
src/composables/useLeitura.js          versão/livro/capítulo, carregamento e navegação
src/composables/usePreferencias.js     tema e tamanho do texto
src/components/                        barras, texto e janela de seleção
src/estilo.css                         todo o CSS (sem Bootstrap/Material)
```

## O que mudou em relação à versão Angular

| | Angular | Vue |
|---|---|---|
| JS inicial | 13,3 MB (4 MB gzip): as 3 Bíblias dentro do bundle | 80 KB (31 KB gzip) |
| CSS | Bootstrap + tema Material (~32 KB gzip) | 6 KB (2 KB gzip) |
| Fontes externas | Roboto + Material Icons (Google Fonts) | nenhuma (fontes do sistema, ícones SVG) |
| Primeiro capítulo | depois de baixar tudo | baixa só o livro aberto (~60 KB gzip) |
| Offline | tudo no bundle | service worker baixa a versão aberta em segundo plano |

## Busca textual

O botão de lupa (ou a tecla `/`) abre a busca na versão selecionada. Maiúsculas,
acentos e pontuação são ignorados: `nao mataras` encontra "Não matarás" e
`no principio deus` encontra "No princípio, Deus". Os resultados mostram o trecho
marcado; tocar em um deles abre o capítulo e destaca o versículo.

A busca roda em um Web Worker ([src/busca/](src/busca/)), que carrega os 66 livros
da versão (do cache offline quando já baixados) e pesquisa sem travar a tela.

Outras melhorias:
- Avançar/voltar atravessa livros (Gênesis 50 → Êxodo 1).
- Escolher um livro já abre a grade de capítulos.
- Tema (claro/escuro) e tamanho do texto ficam salvos; o tema inicial segue o sistema.
- Setas ← → do teclado trocam de capítulo.
- Corrigido NVT Salmos 119:13/130 (versículo 130 estava agrupado no 13).
