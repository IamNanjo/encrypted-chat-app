export default defineNuxtConfig({
  app: {
    pageTransition: { name: "page", mode: "out-in" },
    head: {
      title: "Encrypted Chat App",
    },
  },
  modules: ["nuxt-icon", "@nuxtjs/plausible"],
  plausible: { apiHost: "https://plausible.nanjo.tech" },
});
