<script setup lang="ts">
const auth = useAuth();
const keyPair = useKeyPair();

const { refresh: refreshDevice } = useLazyAsyncData(
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
  <NuxtLoadingIndicator color="#FF6961" :height="2" />
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

::-webkit-scrollbar {
  width: var(--scrollbar-size);
  height: var(--scrollbar-size);
}
::-webkit-scrollbar-track {
  background-color: transparent;
}
::-webkit-scrollbar-thumb {
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
  color-scheme: dark;
  --bg-primary: #121212;
  --bg-raise: rgba(255, 255, 255, 0.07);
  --bg-raise-1: #232323;
  --bg-raise-2: #333333;
  --fg-primary: white;
  --text-primary: white;
  --text-alt: black;
  --text-muted: #7f7f7f;
  --ff-primary: system-ui, sans-serif;
  --scrollbar-size: 4px;
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
  overflow: hidden;
}

pre,
code {
  font-family: var(--ff-mono);
}

main {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  height: calc(100% - 3rem);
  overflow-x: hidden;
  overflow-y: auto;
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

.icon {
  color: var(--text-primary);
  filter: drop-shadow(1px 1px 1px var(--text-muted));
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
