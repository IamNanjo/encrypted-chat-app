<script setup lang="ts">
const auth = useAuth();
const keyPair = useKeyPair();
</script>

<template>
  <main>
    <template
      v-if="keyPair && auth.authenticated && auth.currentDevice !== null"
    >
      <ChatMenu />
      <Chat />
    </template>
    <ClientOnly v-else
      ><main class="loading">
        <div class="loading__text">Loading cryptographic keypair</div>
        <div class="loading__ring">
          <div></div>
          <div></div>
          <div></div>
          <div></div>
        </div></main
    ></ClientOnly>
  </main>
</template>

<style scoped lang="scss">
main {
  align-items: stretch;
}

// Loading
.loading {
  display: flex;
  flex-direction: column;
  gap: 1rem;

  &__text {
    font-size: 1.25rem;
    font-weight: 700;
  }

  &__ring,
  &__ring div {
    box-sizing: border-box;
  }
  &__ring {
    display: inline-block;
    position: relative;
    width: 80px;
    height: 80px;
  }
  &__ring div {
    box-sizing: border-box;
    display: block;
    position: absolute;
    width: 64px;
    height: 64px;
    margin: 8px;
    border: 8px solid currentColor;
    border-radius: 50%;
    animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
    border-color: currentColor transparent transparent transparent;
  }
  &__ring div:nth-child(1) {
    animation-delay: -0.45s;
  }
  &__ring div:nth-child(2) {
    animation-delay: -0.3s;
  }
  &__ring div:nth-child(3) {
    animation-delay: -0.15s;
  }
}

@keyframes lds-ring {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
