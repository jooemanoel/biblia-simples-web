<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import BarraInferior from "./components/BarraInferior.vue";
import BarraSuperior from "./components/BarraSuperior.vue";
import BuscaTexto from "./components/BuscaTexto.vue";
import JanelaSeletor from "./components/JanelaSeletor.vue";
import TextoCapitulo from "./components/TextoCapitulo.vue";
import { INICIO_NT, LIVROS, VERSOES, useLeitura } from "./composables/useLeitura.js";

const leitura = useLeitura();
const { versao, livroId, livro, capituloId, exibido } = leitura;

/** Janela aberta: "versao", "livro", "capitulo" ou null. */
const janela = ref(null);

const TITULOS = { versao: "Versão", livro: "Livro", capitulo: "Capítulo", busca: "Buscar" };
const tituloJanela = computed(() =>
  janela.value === "capitulo" ? livro.value.nome : TITULOS[janela.value] ?? ""
);

const testamentos = [
  { nome: "Antigo Testamento", livros: LIVROS.slice(0, INICIO_NT).map((l, i) => ({ ...l, i })) },
  { nome: "Novo Testamento", livros: LIVROS.slice(INICIO_NT).map((l, i) => ({ ...l, i: i + INICIO_NT })) },
];

function escolherVersao(sigla) {
  leitura.selecionarVersao(sigla);
  janela.value = null;
}

// Depois do livro, já abre a escolha do capítulo (exceto livros de capítulo único).
function escolherLivro(indice) {
  leitura.selecionarLivro(indice);
  janela.value = LIVROS[indice].capitulos > 1 ? "capitulo" : null;
}

function escolherCapitulo(indice) {
  leitura.selecionarCapitulo(indice);
  janela.value = null;
}

function escolherResultado(r) {
  leitura.irParaVersiculo(r);
  janela.value = null;
}

// Ao trocar de capítulo, volta ao topo e atualiza o título da aba.
watch(exibido, (atual, antigo) => {
  if (!atual) return;
  document.title = `${LIVROS[atual.livro].nome} ${atual.capitulo + 1} · Bíblia`;
  if (antigo && (antigo.livro !== atual.livro || antigo.capitulo !== atual.capitulo)) {
    window.scrollTo({ top: 0 });
  }
});

// Teclado: setas trocam de capítulo; "/" abre a busca.
function aoTeclar(e) {
  if (janela.value || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.key === "ArrowLeft") leitura.voltar();
  else if (e.key === "ArrowRight") leitura.avancar();
  else if (e.key === "/") {
    e.preventDefault();
    janela.value = "busca";
  }
}
onMounted(() => window.addEventListener("keydown", aoTeclar));
onBeforeUnmount(() => window.removeEventListener("keydown", aoTeclar));
</script>

<template>
  <BarraSuperior @abrir="janela = $event" />
  <TextoCapitulo />
  <BarraInferior @buscar="janela = 'busca'" />

  <JanelaSeletor
    :titulo="tituloJanela"
    :aberta="janela !== null"
    :class="{ 'janela-alta': janela === 'busca' }"
    @fechar="janela = null"
  >
    <BuscaTexto v-if="janela === 'busca'" @escolher="escolherResultado" />

    <ul v-else-if="janela === 'versao'" class="lista-versoes">
      <li v-for="v in VERSOES" :key="v.sigla">
        <button :class="{ atual: v.sigla === versao }" @click="escolherVersao(v.sigla)">
          <strong>{{ v.sigla }}</strong>
          <span>{{ v.nome }}</span>
        </button>
      </li>
    </ul>

    <template v-else-if="janela === 'livro'">
      <section v-for="t in testamentos" :key="t.nome">
        <h3 class="subtitulo">{{ t.nome }}</h3>
        <div class="grade-livros">
          <button
            v-for="l in t.livros"
            :key="l.i"
            :class="{ atual: l.i === livroId }"
            @click="escolherLivro(l.i)"
          >
            {{ l.nome }}
          </button>
        </div>
      </section>
    </template>

    <div v-else-if="janela === 'capitulo'" class="grade-capitulos">
      <button
        v-for="n in livro.capitulos"
        :key="n"
        :class="{ atual: n - 1 === capituloId }"
        @click="escolherCapitulo(n - 1)"
      >
        {{ n }}
      </button>
    </div>
  </JanelaSeletor>
</template>
