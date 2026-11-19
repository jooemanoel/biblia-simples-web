// Preferências visuais: tema (claro/escuro) e tamanho do texto. Ambas ficam salvas.
import { ref, watch } from "vue";

const COR_BARRA = { claro: "#006a6a", escuro: "#1b2627" };

export const FONTE_MIN = 12;
export const FONTE_MAX = 48;
const PASSO = 2;

function ler(chave) {
  try {
    return localStorage.getItem(chave);
  } catch {
    return null;
  }
}

function gravar(chave, valor) {
  try {
    localStorage.setItem(chave, valor);
  } catch {}
}

// O tema inicial já foi aplicado por um script no index.html (antes da primeira pintura).
const tema = ref(document.documentElement.dataset.tema === "escuro" ? "escuro" : "claro");

const fonteSalva = Number(ler("tamanhoFonte"));
const tamanhoFonte = ref(
  fonteSalva >= FONTE_MIN && fonteSalva <= FONTE_MAX ? fonteSalva : 18
);

watch(
  tema,
  (t) => {
    document.documentElement.dataset.tema = t;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", COR_BARRA[t]);
  },
  { immediate: true }
);

watch(
  tamanhoFonte,
  (px) => {
    document.documentElement.style.setProperty("--tamanho-texto", `${px}px`);
    gravar("tamanhoFonte", String(px));
  },
  { immediate: true }
);

export function usePreferencias() {
  return {
    tema,
    tamanhoFonte,
    alternarTema() {
      tema.value = tema.value === "escuro" ? "claro" : "escuro";
      gravar("tema", tema.value);
    },
    aumentarFonte: () => (tamanhoFonte.value = Math.min(tamanhoFonte.value + PASSO, FONTE_MAX)),
    diminuirFonte: () => (tamanhoFonte.value = Math.max(tamanhoFonte.value - PASSO, FONTE_MIN)),
  };
}
