<script setup lang="ts">
const { session, remove: removeSession } = await useSession();
const { $socket } = useNuxtApp();
const auth = useAuth();
const keyPair = useKeyPair();

const gotKeyPair = ref(false);

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

function getKeyPairFromLocalStorage() {
	let storedKeyPair = localStorage.getItem(auth.value.userId);

	if (!storedKeyPair) {
		const newKeys = generateKeyPair();

		newKeys.then(({ privateKey, publicKey }) => {
			Promise.all([
				crypto.subtle.exportKey("jwk", privateKey),
				crypto.subtle.exportKey("jwk", publicKey)
			]).then(([exportedPrivateKey, exportedPublicKey]) => {
				localStorage.setItem(
					auth.value.userId,
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

function getKeyPairFromIDB() {
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
			.get(IDBKeyRange.only(auth.value.userId));

		getRequest.onsuccess = () => {
			if (getRequest.result === undefined) {
				generateKeyPair().then((generatedKeyPair) => {
					const transaction = db.transaction(["keyPairs"], "readwrite");
					const objectStore = transaction.objectStore("keyPairs");
					const addRequest = objectStore.add({
						userId: auth.value.userId,
						keyPair: generatedKeyPair
					});

					keyPair.value = generatedKeyPair;

					addRequest.onsuccess = () => db.close();
					addRequest.onerror = () => db.close();
				});
			} else if ("keyPair" in getRequest.result) {
				keyPair.value = getRequest.result.keyPair;
			}
		};
	};

	dbPromise.onerror = (e) => {
		getKeyPairFromLocalStorage();
	};
}

async function updateDevice() {
	if (auth.value.authenticated && keyPair.value) {
		$fetch("/api/device", {
			method: "POST",
			body: {
				key: JSON.stringify(
					await crypto.subtle.exportKey("jwk", keyPair.value.publicKey)
				)
			},
			retry: false
		})
			.then((res) => {
				if (res) {
					auth.value.currentDevice = res;
				}
			})
			.catch(console.error);
	}

	setTimeout(updateDevice, 5000);
}

onMounted(() => {
	// Check session status and update auth state
	const unwatchSession = watch(session, (newSession) => {
		if (newSession === null || !("userId" in newSession))
			return navigateTo("/login");

		auth.value.authenticated = "username" in newSession;
		auth.value.userId = newSession.userId || "";
		auth.value.username = newSession.username || "";

		unwatchSession();
	});

	const unwatchAuth = watch(auth, (newAuth) => {
		if (!newAuth.authenticated) return;
		if (gotKeyPair.value) unwatchAuth();

		if ("indexedDB" in window) getKeyPairFromIDB();
		else getKeyPairFromLocalStorage();
	});

	const unwatchKeyPair = watch(keyPair, (newKeyPair) => {
		if (newKeyPair) {
			updateDevice();
			unwatchKeyPair();
		}
	});

	$socket.onopen = () => {
		$socket.send(`${auth.value.userId}`);
	};

	$socket.onmessage = (e) => {
		console.log(JSON.parse(e.data));
	};

	$socket.onclose = async (e) => {
		await removeSession();
		auth.value = {
			authenticated: false,
			userId: "",
			username: "",
			currentDevice: null
		};
		return await navigateTo("/login");
	};
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

#__nuxt {
	display: contents;
}

html,
body {
	height: 100%;
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
	min-height: calc(100vh - 3em);
	min-height: calc(100svh - 3em);
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
	user-select: none;
	cursor: not-allowed;
}

.no-select {
	user-select: none;
}

.raise {
	background-color: var(--bg-raise);
}
</style>
