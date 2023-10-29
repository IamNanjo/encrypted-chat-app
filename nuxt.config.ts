const isProduction = process.env.NODE_ENV === "production";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
	devtools: { enabled: true },
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
			expiryInSeconds: 7200,
			rolling: true,
			storePrefix: "session",
			idLength: 128,
			storageOptions: {
				driver: isProduction ? "redis" : "memory",
				options: isProduction
					? {
							base: "chatapp"
					  }
					: {}
			}
		}
	},
	colorMode: { classSuffix: "", storageKey: "theme" }
});
