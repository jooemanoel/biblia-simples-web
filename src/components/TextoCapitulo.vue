<script setup>
import { ref, watch } from "vue";
import { LIVROS, VERSOES, useLeitura } from "../composables/useLeitura.js";

const { exibido, carregando, erro, recarregar, versiculoAlvo } = useLeitura();
const nomeVersao = (sigla) => VERSOES.find((v) => v.sigla === sigla)?.nome ?? sigla;

// Versículo vindo da busca: rola até ele e o destaca por alguns segundos.
const destacado = ref(null);
let temporizador = null;

watch(
  [exibido, versiculoAlvo],
  ([atual, alvo]) => {
    if (!atual || !alvo || alvo.livro !== atual.livro || alvo.capitulo !== atual.capitulo) return;
    versiculoAlvo.value = null;
    document.getElementById(`v${alvo.versiculo + 1}`)?.scrollIntoView({ block: "center" });
    destacado.value = alvo.versiculo;
    clearTimeout(temporizador);
    temporizador = setTimeout(() => (destacado.value = null), 2500);
  },
  { flush: "post" }
);
</script>

<template>
  <main class="leitura" :aria-busy="carregando">
    <div v-if="erro" class="aviso">
      <p>Não foi possível carregar este capítulo.<br />Verifique sua conexão.</p>
      <button class="botao-texto" @click="recarregar">Tentar de novo</button>
    </div>

    <article v-else-if="exibido" :class="{ esmaecido: carregando }">
      <h1 class="titulo-capitulo">
        {{ LIVROS[exibido.livro].nome }} {{ exibido.capitulo + 1 }}
        <small :title="nomeVersao(exibido.versao)">{{ exibido.versao }}</small>
      </h1>
      <p
        v-for="(versiculo, i) in exibido.versiculos"
        :id="`v${i + 1}`"
        :key="i"
        class="versiculo"
        :class="{ destacado: destacado === i }"
      >
        <sup class="numero">{{ i + 1 }}</sup>{{ versiculo }}
      </p>
    </article>

    <div v-else class="aviso" role="status">Carregando…</div>
  </main>
</template>
