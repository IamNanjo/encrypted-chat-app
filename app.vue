<script setup lang="ts">
const { session } = await useSession();
const auth = useAuth();
const keyPair = useKeyPair();

onMounted(() => {
	// Check session status on page load and update auth state
	watch(session, (newSession) => {
		if (newSession !== null && !auth.value.authenticated) {
			auth.value = {
				authenticated: "username" in newSession,
				username: newSession.username || "",
				currentDevice: null
			};
		} else {
			return navigateTo("/login");
		}
	});

	// Save / Load saved key pair from localStorage

	let storedKeyPair = {
		privateKey: localStorage.getItem("privateKey"),
		publicKey: localStorage.getItem("publicKey")
	};

	if (!storedKeyPair.privateKey || !storedKeyPair.publicKey) {
		const newKeys = crypto.subtle.generateKey(
			{
				name: "RSA-OAEP",
				modulusLength: 4096,
				publicExponent: new Uint8Array([1, 0, 1]),
				hash: "SHA-256"
			} as RsaHashedKeyGenParams,
			true,
			["encrypt", "decrypt"]
		) as Promise<CryptoKeyPair>;

		newKeys.then(({ privateKey, publicKey }) => {
			Promise.all([
				crypto.subtle.exportKey("jwk", privateKey),
				crypto.subtle.exportKey("jwk", publicKey)
			]).then(([exportedPrivateKey, exportedPublicKey]) => {
				localStorage.setItem("privateKey", JSON.stringify(exportedPrivateKey));
				localStorage.setItem("publicKey", JSON.stringify(exportedPublicKey));

				keyPair.value = {
					privateKey,
					publicKey
				};
			});
		});
	} else {
		// Import private and public key concurrently
		Promise.all([
			crypto.subtle.importKey(
				"jwk",
				JSON.parse(storedKeyPair.privateKey),
				{ name: "RSA-OAEP", hash: "SHA-256" },
				true,
				["decrypt"]
			),
			crypto.subtle.importKey(
				"jwk",
				JSON.parse(storedKeyPair.publicKey),
				{ name: "RSA-OAEP", hash: "SHA-256" },
				true,
				["encrypt"]
			)
		]).then(([privateKey, publicKey]) => {
			keyPair.value = { privateKey, publicKey };
		});
	}

	// Save public key / device into the database
	watch([auth, keyPair], async ([newAuth, newKeyPair]) => {
		if (
			newAuth.authenticated &&
			newKeyPair &&
			!newAuth.currentDevice &&
			localStorage.getItem("publicKey")
		) {
			const device = await useFetch("/api/device", {
				method: "post",
				body: { key: localStorage.getItem("publicKey") }
			});

			if (device.status.value === "success") {
				auth.value.currentDevice = device.data.value;
			}
		}
	});
});
</script>

<template>
	<NavBar />
	<NuxtPage />
</template>

<style lang="scss">
.page-enter-active,
.page-leave-active {
	transition: all 0.1s;
}

.page-enter-from,
.page-leave-to {
	opacity: 0;
	filter: blur(1rem);
}

*,
*::before,
*::after {
	box-sizing: border-box;
	margin: 0;
	padding: 0;
	font: inherit;
	text-decoration: none;
	transition-property: background-color, color;
	transition-duration: 0.1s;
	transition-timing-function: linear;
}

:root {
	color-scheme: light;
	--bg-primary: hsl(0, 0%, 80%);
	--bg-raise: rgba(0, 0, 0, 0.125);
	--bg-raise-1: var(--bg-primary);
	--bg-raise-2: var(--bg-raise);
	--fg-primary: #ff6961;
	--text-primary: black;
	--text-alt: var(--fg-primary);
	--text-muted: #444444;
	--ff-primary: Roboto, sans-serif;
	--ff-mono: "JetBrains Mono", monospace;
}
:root.dark {
	color-scheme: dark;
	--bg-primary: #121212;
	--bg-raise: rgba(255, 255, 255, 0.07);
	--bg-raise-1: #232323;
	--bg-raise-2: #333333;
	--fg-primary: #ff6961;
	--text-primary: white;
	--text-alt: var(--fg-primary);
	--text-muted: #999999;
	--ff-primary: Roboto, sans-serif;
	--ff-mono: "JetBrains Mono", monospace;
}

:root .icon {
	color: black;
}
:root.dark .icon {
	color: white;
	filter: drop-shadow(1px 1px 1px black);
}

body {
	position: relative;
	background-color: var(--bg-primary);
	color: var(--text-primary);
	font-family: var(--ff-primary);
	z-index: 0;
}

pre,
code {
	font-family: var(--ff-mono);
}

main {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100vh;
	height: 100svh;
	padding-top: 3em;
}

a {
	color: var(--text-primary);
	user-select: none;

	&:visited {
		color: var(--text-primary);
	}
}

button {
	box-shadow: none;
	border-style: none;
}

.clickable,
button {
	user-select: none;
	cursor: pointer;
}

:disabled {
	cursor: not-allowed;
}

.no-select {
	user-select: none;
}

.raise {
	background-color: var(--bg-raise);
}
</style>
