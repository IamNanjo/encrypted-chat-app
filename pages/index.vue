<script setup lang="ts">
const auth = useAuth();
const keyPair = useKeyPair();
</script>

<template>
  <main v-if="keyPair && auth.authenticated && auth.currentDevice !== null">
    <ChatMenu /><Chat />
  </main>
  <main v-else class="loading">
    <div class="loading__text">Loading cryptographic keypair</div>
    <div class="loading__ring">
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  </main>
</template>

<style lang="scss">
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

// Loading end

.chat-menu {
  flex-basis: 0;
  min-width: 0;
  transition: flex 0.2s ease;
  overflow-x: hidden;
  overflow-y: auto;
  text-wrap: nowrap;

  &.open {
    flex-basis: 100%;
  }
}

.chat-menu,
.chat {
  height: calc(100%);
}

.chat {
  flex-basis: 100%;
}

.chat-menu.open + .chat {
  flex-basis: 0;
  padding: 0;
}

@media screen and (min-width: 800px) {
  .mobile-menu {
    display: block;

    &__toggle {
      transform: translateX(-5em) rotate(-90deg);
    }
  }

  .chat-menu {
    border-right: 1px solid var(--bg-raise);

    & + .chat {
      flex-basis: 100%;
    }
  }

  .chat-menu,
  .chat-menu.open {
    flex-basis: 16em;
  }
}
</style>
