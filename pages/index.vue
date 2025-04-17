<script setup lang="ts">
const auth = useAuth();
const keyPair = useKeyPair();
const selectedChat = useChat();
const socket = useSocket();

onBeforeUnmount(() => {
    selectedChat.value = null;
});
</script>

<template>
    <main>
        <template v-if="!auth.authenticated"></template>
        <LoadingSpinner
            v-else-if="!keyPair || !auth.currentDevice"
            text="Loading cryptographic keypair"
        />
        <LoadingSpinner
            v-else-if="socket?.readyState !== socket?.OPEN"
            text="Waiting for WebSocket connection"
        />
        <template v-else>
            <ChatMenu />
            <Chat />
        </template>
    </main>
</template>
