<script setup>
// Janela de seleção (versão, livro ou capítulo) usando o <dialog> nativo:
// fundo escurecido, tecla Esc e foco preso dentro da janela já vêm do navegador.
// No celular aparece como "folha" vinda de baixo; em telas largas, centralizada.
import { nextTick, ref, watch } from "vue";
import Icone from "./Icone.vue";

const props = defineProps({ titulo: String, aberta: Boolean });
const emit = defineEmits(["fechar"]);
const janela = ref(null);

// Observa também o título: a janela pode passar de "Livro" para "Capítulo" sem fechar.
watch(
  () => [props.aberta, props.titulo],
  async ([aberta]) => {
    const el = janela.value;
    if (!el) return;
    if (!aberta) {
      if (el.open) el.close();
      return;
    }
    if (!el.open) el.showModal();
    await nextTick();
    // Campo marcado com data-foco (ex.: busca) recebe o foco ao abrir.
    el.querySelector("[data-foco]")?.focus();
    // Mostra o item atual (ex.: Salmos, capítulo 119) sem precisar rolar.
    const atual = el.querySelector(".atual");
    if (atual) {
      el.querySelector(".janela-corpo").scrollTop = 0;
      atual.scrollIntoView({ block: "center" });
    }
  },
  { flush: "post" }
);

// Clique no fundo escurecido (fora do conteúdo) fecha a janela.
function aoClicar(evento) {
  if (evento.target === janela.value) emit("fechar");
}
</script>

<template>
  <dialog ref="janela" class="janela" :aria-label="titulo" @close="emit('fechar')" @click="aoClicar">
    <div class="janela-cabecalho">
      <h2>{{ titulo }}</h2>
      <button class="botao-icone" aria-label="Fechar" @click="emit('fechar')">
        <Icone nome="fechar" />
      </button>
    </div>
    <!-- autofocus: o foco inicial vai para a lista, e não para o botão Fechar
         (que ficaria com o anel de foco destacado ao abrir). -->
    <div class="janela-corpo" tabindex="-1" autofocus>
      <slot />
    </div>
  </dialog>
</template>
