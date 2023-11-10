const isProduction = process.env.NODE_ENV === "production";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: false },
	app: {
		pageTransition: { name: "page", mode: "out-in" },
		head: {
			title: "Encrypted Chat App"
		}
	},
	modules: [
		"@sidebase/nuxt-session",
		"@nuxtjs/color-mode",
		"nuxt-icon",
		"@nuxtjs/plausible"
	],
	session: {
		isEnabled: true,
		session: {
			cookieSecure: true,
			cookieHttpOnly: true,
			cookieSameSite: "strict",
			expiryInSeconds: 1800, // 30 minute sessions
			rolling: true, // Refresh session on every request
			storePrefix: "session",
			idLength: 128, // Session id length of 128 instead of default 64
			storageOptions: {
				driver: isProduction ? "redis" : "memory",
				options: { base: "sessions" }
			}
		},
		api: { methods: ["get", "delete"] }
	},
	colorMode: { classSuffix: "", storageKey: "theme", fallback: "dark" },
	plausible: { apiHost: "https://plausible.nanjo.tech" }
});
