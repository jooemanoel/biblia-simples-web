<script setup>
import Icone from "./Icone.vue";
import { referencia, useLeitura } from "../composables/useLeitura.js";
import { FONTE_MAX, FONTE_MIN, usePreferencias } from "../composables/usePreferencias.js";

defineEmits(["buscar"]);
const { anterior, seguinte, voltar, avancar } = useLeitura();
const { tema, tamanhoFonte, alternarTema, aumentarFonte, diminuirFonte } = usePreferencias();
</script>

<template>
  <footer class="barra barra-inferior">
    <div class="grupo">
      <button
        class="botao-icone"
        :disabled="tamanhoFonte <= FONTE_MIN"
        aria-label="Diminuir texto"
        title="Diminuir texto"
        @click="diminuirFonte"
      >
        <Icone nome="fonteMenor" />
      </button>
      <button
        class="botao-icone"
        :disabled="tamanhoFonte >= FONTE_MAX"
        aria-label="Aumentar texto"
        title="Aumentar texto"
        @click="aumentarFonte"
      >
        <Icone nome="fonteMaior" />
      </button>
    </div>

    <div class="grupo">
      <button
        class="botao-icone"
        :aria-label="tema === 'escuro' ? 'Usar tema claro' : 'Usar tema escuro'"
        :title="tema === 'escuro' ? 'Tema claro' : 'Tema escuro'"
        @click="alternarTema"
      >
        <Icone :nome="tema === 'escuro' ? 'temaClaro' : 'temaEscuro'" />
      </button>
      <button
        class="botao-icone"
        aria-label="Buscar no texto"
        title="Buscar (/)"
        @click="$emit('buscar')"
      >
        <Icone nome="buscar" />
      </button>
    </div>

    <div class="grupo">
      <button
        class="botao-icone"
        :disabled="!anterior"
        :aria-label="anterior ? `Anterior: ${referencia(anterior)}` : 'Capítulo anterior'"
        :title="referencia(anterior)"
        @click="voltar"
      >
        <Icone nome="anterior" />
      </button>
      <button
        class="botao-icone"
        :disabled="!seguinte"
        :aria-label="seguinte ? `Próximo: ${referencia(seguinte)}` : 'Próximo capítulo'"
        :title="referencia(seguinte)"
        @click="avancar"
      >
        <Icone nome="seguinte" />
      </button>
    </div>
  </footer>
</template>
