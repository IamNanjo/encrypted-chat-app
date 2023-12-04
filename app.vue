<script setup lang="ts">
import type { User } from "./composables/useAuth";

const { session } = await useSession();
const auth = useAuth();
const keyPair = useKeyPair();

const interval = ref(0);

// Allow updating the device (last used time) from anywhere using refreshNuxtData
const {refresh: refreshDevice} = await useLazyAsyncData(
	"updateDevice",
	() => updateDevice(),
	{ server: false, immediate: false, watch: [auth, keyPair] }
);

function generateKeyPair() {
	return crypto.subtle.generateKey(
		{
			name: "RSA-OAEP",
			modulusLength: 4096,
			publicExponent: new Uint8Array([1, 0, 1]),
			hash: "SHA-512"
		} as RsaHashedKeyGenParams,
		true,
		["encrypt", "decrypt"]
	) as Promise<CryptoKeyPair>;
}

function getKeyPairFromLocalStorage(userId: string) {
	let storedKeyPair = localStorage.getItem(userId);

	if (!storedKeyPair) {
		const newKeys = generateKeyPair();

		newKeys.then(({ privateKey, publicKey }) => {
			Promise.all([
				crypto.subtle.exportKey("jwk", privateKey),
				crypto.subtle.exportKey("jwk", publicKey)
			]).then(([exportedPrivateKey, exportedPublicKey]) => {
				localStorage.setItem(
					userId,
					JSON.stringify({
						privateKey: exportedPrivateKey,
						publicKey: exportedPublicKey
					})
				);

				keyPair.value = {
					privateKey,
					publicKey
				};
			});
		});
	} else {
		const keys: { privateKey: JsonWebKey; publicKey: JsonWebKey } =
			JSON.parse(storedKeyPair);

		// Import private and public key concurrently
		Promise.all([
			crypto.subtle.importKey(
				"jwk",
				keys.privateKey,
				{ name: "RSA-OAEP", hash: "SHA-512" },
				true,
				["decrypt"]
			),
			crypto.subtle.importKey(
				"jwk",
				keys.publicKey,
				{ name: "RSA-OAEP", hash: "SHA-512" },
				true,
				["encrypt"]
			)
		]).then(([privateKey, publicKey]) => {
			keyPair.value = { privateKey, publicKey };
		});
	}
}

function getKeyPairFromIDB(userId: string) {
	const dbPromise = window.indexedDB.open("chatAppDB", 1);

	dbPromise.onupgradeneeded = (e) => {
		const db: IDBDatabase = (e.target as any).result;

		const objectStore = db.createObjectStore("keyPairs", {
			keyPath: "id",
			autoIncrement: true
		});

		objectStore.createIndex("userId", "userId", { unique: true });
	};

	dbPromise.onsuccess = (e) => {
		const db: IDBDatabase = (e.target as any).result;
		const transaction = db.transaction(["keyPairs"], "readonly");
		const objectStore = transaction.objectStore("keyPairs");

		const getRequest = objectStore
			.index("userId")
			.get(IDBKeyRange.only(userId));

		getRequest.onsuccess = () => {
			if (getRequest.result === undefined) {
				generateKeyPair().then((generatedKeyPair) => {
					const transaction = db.transaction(["keyPairs"], "readwrite");
					const objectStore = transaction.objectStore("keyPairs");
					const addRequest = objectStore.add({
						userId,
						keyPair: generatedKeyPair
					});

					keyPair.value = generatedKeyPair;

					addRequest.onsuccess = () => db.close();
					addRequest.onerror = () => db.close();
				});
			} else if ("keyPair" in getRequest.result) {
				keyPair.value = getRequest.result.keyPair;
				updateDevice();
			}
		};
	};

	dbPromise.onerror = (e) => {
		getKeyPairFromLocalStorage(userId);
	};
}

async function updateDevice() {
	if (auth.value.authenticated && keyPair.value) {
		const device = await useFetch("/api/device", {
			method: "post",
			body: {
				key: JSON.stringify(
					await crypto.subtle.exportKey("jwk", keyPair.value.publicKey)
				)
			}
		});

		if (device.status.value === "success") {
			auth.value.currentDevice = device.data.value;
		}

		return device.data.value;
	} else if (!auth.value.authenticated && !keyPair.value) {
		return;
	} else if (!keyPair.value && "indexedDB" in window) {
		getKeyPairFromIDB(auth.value.userId);
	} else {
		getKeyPairFromLocalStorage(auth.value.userId);
	}
}

// Check session status and update auth state
watch(session, (newSession) => {
	if (newSession === null || !("userId" in newSession))
		return navigateTo("/login");

	auth.value.authenticated = "username" in newSession;
	auth.value.userId = newSession.userId || "";
	auth.value.username = newSession.username || "";
});

onMounted(() => {
	// Save public key / device into the database
	watch(auth, (newAuth) => {
		if (newAuth.userId && !keyPair.value) {
			// Save / Load saved key pair
			if ("indexedDB" in window) getKeyPairFromIDB(newAuth.userId);
			else getKeyPairFromLocalStorage(newAuth.userId);
		}
	});

	interval.value = window.setInterval(() => {
		refreshDevice();
	}, 5000);
});

onUnmounted(() => clearInterval(interval.value))
</script>

<template>
	<NavBar />
	<NuxtLoadingIndicator />
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
	overflow-x: hidden;
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
