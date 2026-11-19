// Gera os ícones do PWA a partir do símbolo "book_2" do Material Symbols (Google),
// com uma pequena cruz recortada na capa para identificar a Bíblia.
// Fonte: https://fonts.google.com/icons?selected=Material+Symbols+Rounded:book_2:FILL@1
// Uso: npm run icones   (grava em public/, que o Vite copia para o build)
import { mkdirSync, writeFileSync } from "node:fs";
import sharp from "sharp";

// Mesma cor de destaque do estilo.css (tema claro).
// Branco sobre #006a6a tem contraste de 6,4:1 (WCAG AA exige 4,5:1, e 3:1 para ícones).
const COR_FUNDO = "#006a6a";
const COR_SIMBOLO = "#ffffff";

// Desenho original do símbolo (viewBox 0 -960 960 960).
const SIMBOLO_LIVRO =
  "M290-80q-54 0-92-38t-38-92v-540q0-54 38-92t92-38h450q25 0 42.5 17.5T800-820v515q0 9-5 16.5T781-277q-19 8-30 26t-11 41q0 23 11 40.5t30 25.5q9 4 14 13t5 21q0 12-8.5 21T770-80H290Zm81.5-268.5Q380-357 380-370v-420q0-13-8.5-21.5T350-820q-13 0-21.5 8.5T320-790v420q0 13 8.5 21.5T350-340q13 0 21.5-8.5ZM290-140h409q-9-15-14-33t-5-37q0-20 5-37.5t15-32.5H290q-29 0-49.5 20.5T220-210q0 29 20.5 49.5T290-140Z";

// Cruz centralizada na área livre da capa (entre a lombada e a borda direita).
const CRUZ = `
  <rect x="566" y="-740" width="48" height="320" rx="16"/>
  <rect x="486" y="-668" width="208" height="48" rx="16"/>`;

/**
 * Monta o SVG do ícone: fundo colorido com o símbolo branco centralizado.
 * @param tamanho      lado do ícone em pixels
 * @param proporcao    fração do lado ocupada pelo símbolo
 * @param cantos       raio dos cantos (0 = quadrado, para ícones "maskable")
 */
function montarSvg(tamanho, proporcao, cantos) {
  const lado = tamanho * proporcao;
  const margem = (tamanho - lado) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tamanho}" height="${tamanho}" viewBox="0 0 ${tamanho} ${tamanho}">
  <rect width="${tamanho}" height="${tamanho}" rx="${cantos}" fill="${COR_FUNDO}"/>
  <svg x="${margem}" y="${margem}" width="${lado}" height="${lado}" viewBox="0 -960 960 960">
    <path d="${SIMBOLO_LIVRO}" fill="${COR_SIMBOLO}"/>
    <g fill="${COR_FUNDO}">${CRUZ}
    </g>
  </svg>
</svg>`;
}

async function gerarPng(arquivo, svg) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true }).toFile(arquivo);
  console.log("gerado:", arquivo);
}

mkdirSync("public/icones", { recursive: true });

// Ícone da aba do navegador (vetorial, cantos arredondados).
writeFileSync("public/favicon.svg", montarSvg(64, 0.74, 14));
console.log("gerado: public/favicon.svg");

// Ícones "any": usados como estão, com cantos arredondados.
await gerarPng("public/icones/icone-192.png", montarSvg(192, 0.64, 42));
await gerarPng("public/icones/icone-512.png", montarSvg(512, 0.64, 112));

// Ícone "maskable": o Android recorta no formato do aparelho (círculo, gota...).
// Fundo sem cantos e símbolo menor, dentro da "zona segura" central de 80%.
await gerarPng("public/icones/icone-maskable-512.png", montarSvg(512, 0.52, 0));

// iOS: o próprio sistema arredonda os cantos; tamanho padrão de 180 px.
await gerarPng("public/icones/apple-touch-icon.png", montarSvg(180, 0.6, 0));
