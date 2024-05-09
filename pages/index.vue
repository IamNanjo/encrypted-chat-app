<script setup lang="ts">
const auth = useAuth();
const keyPair = useKeyPair();
</script>

<template>
  <main>
    <LoadingSpinner
      v-if="!keyPair || !auth.authenticated || !auth.currentDevice"
      text="Loading cryptographic keypair"
    />
    <template v-else>
      <ChatMenu />
      <Chat />
    </template>
  </main>
</template>
