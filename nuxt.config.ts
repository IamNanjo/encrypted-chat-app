export default defineNuxtConfig({
  devtools: { enabled: false },
  app: {
    pageTransition: { name: "page", mode: "out-in" },
    head: {
      title: "Encrypted Chat App",
    },
  },
  experimental: {
    restoreState: true,
  },
  modules: [
    "@nuxtjs/color-mode",
    "nuxt-icon",
    "@nuxtjs/plausible",
    "@nuxtjs/google-fonts",
  ],
  colorMode: {
    classSuffix: "",
    storageKey: "theme",
    fallback: "dark",
    preference: "system",
  },
  plausible: { apiHost: "https://plausible.nanjo.tech" },
  googleFonts: {
    families: {
      "Roboto": [400, 700],
      "JetBrains Mono": [400, 700],
    },
  },
});