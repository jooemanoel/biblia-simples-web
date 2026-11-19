<script setup>
import Icone from "./Icone.vue";
import { useLeitura } from "../composables/useLeitura.js";

defineEmits(["abrir"]);
const { versao, livro, capituloId } = useLeitura();
</script>

<template>
  <header class="barra barra-superior">
    <button class="botao-barra" aria-label="Escolher versão" @click="$emit('abrir', 'versao')">
      {{ versao }}<Icone nome="expandir" />
    </button>

    <button
      class="botao-barra botao-livro"
      aria-label="Escolher livro"
      @click="$emit('abrir', 'livro')"
    >
      <span class="reticencias">{{ livro.nome }}</span><Icone nome="expandir" />
    </button>

    <button
      class="botao-barra"
      aria-label="Escolher capítulo"
      @click="$emit('abrir', 'capitulo')"
    >
      {{ capituloId + 1 }}<Icone nome="expandir" />
    </button>
  </header>
</template>
