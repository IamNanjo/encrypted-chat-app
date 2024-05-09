export default defineNuxtConfig({
  app: {
    pageTransition: { name: "page", mode: "out-in" },
    head: {
      title: "Encrypted Chat App",
    },
  },
  modules: ["nuxt-icon", "@nuxtjs/plausible", "@nuxtjs/google-fonts"],
  plausible: { apiHost: "https://plausible.nanjo.tech" },
  googleFonts: {
    families: {
      Roboto: [400, 700],
    },
  },
});
