<script setup>
import { onMounted } from "vue";
import { TAMANHO_MINIMO, useBusca } from "../composables/useBusca.js";
import { LIVROS, useLeitura } from "../composables/useLeitura.js";

const emit = defineEmits(["escolher"]);
const { versao } = useLeitura();
const { termo, itens, total, buscando, progresso, erro, preparar, buscarAoDigitar, buscarAgora, carregarMais } =
  useBusca();

onMounted(preparar);

const formatar = (n) => n.toLocaleString("pt-BR");
const referencia = (r) => `${LIVROS[r.livro].nome} ${r.capitulo + 1}:${r.versiculo + 1}`;
</script>

<template>
  <div class="busca">
    <form class="campo-busca" role="search" @submit.prevent="buscarAgora">
      <input
        v-model="termo"
        data-foco
        type="search"
        enterkeyhint="search"
        autocomplete="off"
        spellcheck="false"
        :placeholder="`Buscar na ${versao}…`"
        aria-label="Texto a buscar"
        @input="buscarAoDigitar"
      />
    </form>

    <p class="estado-busca" role="status">
      <template v-if="erro">Não foi possível carregar o texto. Verifique sua conexão.</template>
      <template v-else-if="progresso">
        Preparando a busca na {{ versao }}… {{ progresso.carregados }}/{{ progresso.total }} livros
      </template>
      <template v-else-if="termo.trim().length < TAMANHO_MINIMO">
        Digite uma palavra ou trecho. Acentos, maiúsculas e pontuação são ignorados.
      </template>
      <template v-else-if="buscando">Buscando…</template>
      <template v-else-if="!total">Nenhum versículo encontrado.</template>
      <template v-else>
        {{ formatar(total) }} {{ total === 1 ? "versículo encontrado" : "versículos encontrados" }}
      </template>
    </p>

    <ol v-if="itens.length && termo.trim().length >= TAMANHO_MINIMO" class="resultados">
      <li v-for="r in itens" :key="`${r.livro}-${r.capitulo}-${r.versiculo}`">
        <button @click="emit('escolher', r)">
          <span class="referencia">{{ referencia(r) }}</span>
          <span class="trecho"
            ><template v-for="(p, i) in r.partes" :key="i"
              ><mark v-if="p[1]">{{ p[0] }}</mark
              ><template v-else>{{ p[0] }}</template></template
            ></span
          >
        </button>
      </li>
    </ol>

    <button
      v-if="itens.length < total && termo.trim().length >= TAMANHO_MINIMO"
      class="botao-texto mais"
      :disabled="buscando"
      @click="carregarMais"
    >
      Mostrar mais ({{ formatar(total - itens.length) }} restantes)
    </button>
  </div>
</template>
