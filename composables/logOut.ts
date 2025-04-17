export default async function logOut() {
    const auth = useAuth();
    const keyPair = useKeyPair();
    const selectedChat = useChat();
    const socket = useSocket();

    if (auth.value.authenticated) {
        auth.value = { authenticated: false };
    }

    keyPair.value = null;
    selectedChat.value = null;

    if (socket.value) {
        socket.value.close(4000);
        socket.value = null;
    }

    await $fetch("/auth/logout", { method: "POST" });

    navigateTo("/login");
}
