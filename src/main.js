import { createApp } from "vue";
import App from "./App.vue";
import "./estilo.css";

createApp(App).mount("#app");

// PWA: registra o service worker só na versão publicada
// (em desenvolvimento ele serviria arquivos antigos do cache).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js")
      .catch((erro) => console.error("Falha ao registrar o service worker:", erro));
  });
}
