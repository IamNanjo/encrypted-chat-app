<script setup lang="ts">
const auth = useAuth();
const keyPair = useKeyPair();

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
      key: JSON.stringify(await exportKey(keyPair.value.publicKey)),
    },
    retry: false,
  }).catch(console.error);

  if (!data) return;

  auth.value.currentDevice = data;
}

onMounted(() => {
  watch(keyPair, (newKeyPair) => {
    if (newKeyPair) {
      refreshDevice();
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
  transition: background-color 0.1s ease;
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
  scrollbar-width: thin;
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
  height: calc(100% - 3em);
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
