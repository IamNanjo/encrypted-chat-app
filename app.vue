<script setup lang="ts">
const socket = useSocket();
const auth = useAuth();
const keyPair = useKeyPair();

const gotKeyPair = ref(false);

const { refresh: refreshDevice } = await useLazyAsyncData(
  "updateDevice",
  updateDevice,
  {
    server: false,
    immediate: false,
  }
);

async function updateDevice() {
  if (!auth.value.authenticated || !keyPair.value) return;

  const data = await $fetch("/api/device", {
    method: "POST",
    body: {
      key: JSON.stringify(
        await crypto.subtle.exportKey("jwk", keyPair.value.publicKey)
      ),
    },
    retry: false,
  }).catch(console.error);

  if (!data) return;

  auth.value.currentDevice = data.id;
}

onMounted(() => {
  const unwatchKeyPair = watch(keyPair, (newKeyPair) => {
    if (newKeyPair) {
      refreshDevice();
      unwatchKeyPair();
    }
  });

  // Initialize socket (automatic restarts when closed)
  if (!socket.value) {
    const wsProtocol =
      window.location.protocol === "https:" ? "wss://" : "ws://";
    const wsURL = `${wsProtocol}${window.location.host}`;

    socket.value = new WebSocket(wsURL);

    const onClose = async () => {
      socket.value = new WebSocket(wsURL);
      socket.value.addEventListener("close", onClose);

      const token = sessionStorage.getItem("jwt");

      if (!token) return navigateTo("/login");

      socket.value.addEventListener("open", () => {
        socket.value!.send(
          JSON.stringify({
            event: "auth",
            mode: "post",
            data: token,
          } as SocketMessage<string>)
        );
      });
    };

    socket.value.addEventListener("close", onClose);

    return;
  }

  watch(socket, (newSocket) => {
    if (!newSocket) return;

    const token = sessionStorage.getItem("jwt");

    if (token) {
      newSocket.addEventListener("open", () => {
        newSocket.send(
          JSON.stringify({
            event: "auth",
            mode: "post",
            data: token,
          } as SocketMessage<string>)
        );
      });
    }

    newSocket.addEventListener("message", async (e) => {
      const { event, mode } = JSON.parse(e.data) as SocketMessage<any>;

      if (event !== "auth" || mode !== "delete") return;

      await $fetch("/auth/logout", { method: "POST" });
      sessionStorage.removeItem("jwt");
      auth.value = {
        authenticated: false,
      };

      navigateTo("/login");
    });
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

::-webkit-scrollbar::-webkit-scrollbar {
  width: var(--scrollbar-size) !important;
  height: var(--scrollbar-size) !important;
}
::-webkit-scrollbar-track::-webkit-scrollbar-track {
  background-color: transparent;
}
::-webkit-scrollbar-thumb::-webkit-scrollbar-thumb {
  background-color: hsl(0, 0%, 69%);
  border-radius: var(--scrollbar-size);
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
  --bg-primary: #f7f7f7;
  --bg-raise: #ffffff;
  --bg-raise-1: #ffffff;
  --bg-raise-2: var(--bg-raise);
  --fg-primary: #ff6961;
  --text-primary: black;
  --text-alt: var(--fg-primary);
  --text-muted: #444444;
  --ff-primary: Roboto, sans-serif;
  --ff-mono: "JetBrains Mono", monospace;
  --scrollbar-size: 6px;
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
  --scrollbar-size: 6px;
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
  scrollbar-width: thin;
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
