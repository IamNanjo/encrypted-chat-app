const isProduction = process.env.NODE_ENV === "production";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: false },
	app: {
		pageTransition: { name: "page", mode: "out-in" }
	},
	modules: ["@sidebase/nuxt-session", "@nuxtjs/color-mode", "nuxt-icon"],
	session: {
		isEnabled: true,
		session: {
			cookieSecure: true,
			cookieHttpOnly: true,
			cookieSameSite: "strict",
			expiryInSeconds: 3600,
			rolling: true,
			storePrefix: "session",
			idLength: 256,
			storageOptions: {
				driver: isProduction ? "redis" : "memory",
				options: { base: "sessions" }
			}
		},
		api: { methods: ["get", "delete"] }
	},
	colorMode: { classSuffix: "", storageKey: "theme" }
});
