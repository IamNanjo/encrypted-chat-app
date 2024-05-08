export default async function logOut() {
  const auth = useAuth();
  const keyPair = useKeyPair();
  const selectedChat = useChat();
  const socket = useSocket();

  auth.value = { authenticated: false };
  keyPair.value = null;
  selectedChat.value = null;
  sessionStorage.removeItem("jwt");

  if (socket.value) {
    socket.value.close();
    socket.value = null;
  }

  await $fetch("/auth/logout", { method: "POST" });

  navigateTo("/login");
}
