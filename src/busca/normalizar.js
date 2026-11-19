// Normalização usada na busca: ignora maiúsculas, acentos e pontuação.
//   "Não matarás!"        -> "nao mataras"
//   "No princípio, Deus"  -> "no principio deus"
//   "bem-aventurados"     -> "bem aventurados"
// Pontuação e espaços viram um único espaço; letras e números são mantidos.

const MARCAS = /\p{M}/gu; // acentos separados pela decomposição NFD
const LETRA_OU_NUMERO = /[\p{L}\p{N}]/u;
const NAO_PALAVRA = /[^\p{L}\p{N}]+/gu;

/** Versão rápida, usada para indexar todos os versículos e o termo buscado. */
export function normalizar(texto) {
  return texto
    .normalize("NFD")
    .replace(MARCAS, "")
    .toLowerCase()
    .replace(NAO_PALAVRA, " ")
    .trim();
}

/**
 * Versão caractere a caractere, que também devolve onde cada caractere normalizado
 * está no texto original. Gera exatamente o mesmo texto que normalizar(), e é usada
 * só nos versículos encontrados, para marcar o trecho certo no texto original.
 */
export function normalizarComMapa(texto) {
  let norm = "";
  const inicio = []; // inicio[i] = posição no original do caractere que gerou norm[i]
  const fim = []; //    fim[i]    = posição seguinte ao fim desse caractere
  for (let i = 0; i < texto.length; ) {
    const ponto = texto.codePointAt(i);
    const largura = ponto > 0xffff ? 2 : 1;
    const c = texto.slice(i, i + largura);
    const base = c.normalize("NFD").replace(MARCAS, "").toLowerCase();
    if (!base) {
      // acento "solto" (marca combinante isolada): ignorado, como em normalizar()
    } else if (LETRA_OU_NUMERO.test(base)) {
      for (const ch of base) {
        norm += ch;
        inicio.push(i);
        fim.push(i + largura);
      }
    } else if (norm && norm[norm.length - 1] !== " ") {
      norm += " ";
      inicio.push(i);
      fim.push(i + largura);
    }
    i += largura;
  }
  if (norm.endsWith(" ")) {
    norm = norm.slice(0, -1);
    inicio.pop();
    fim.pop();
  }
  return { norm, inicio, fim };
}

/**
 * Divide o texto original em partes [texto, marcado] com todas as ocorrências
 * do termo (já normalizado) marcadas.
 */
export function marcarOcorrencias(texto, termo) {
  const { norm, inicio, fim } = normalizarComMapa(texto);
  const partes = [];
  let cursor = 0;
  for (let p = norm.indexOf(termo); p !== -1; p = norm.indexOf(termo, p + termo.length)) {
    const de = inicio[p];
    const ate = fim[p + termo.length - 1];
    if (de > cursor) partes.push([texto.slice(cursor, de), false]);
    partes.push([texto.slice(de, ate), true]);
    cursor = ate;
  }
  if (cursor < texto.length) partes.push([texto.slice(cursor), false]);
  return partes;
}
