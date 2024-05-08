export default async function logOut() {
  const auth = useAuth();
  const keyPair = useKeyPair();
  const selectedChat = useChat();
  const socket = useSocket();

  if (socket.value) {
    socket.value.close();
    socket.value = null;
  }

  auth.value = { authenticated: false };
  keyPair.value = null;
  selectedChat.value = null;
  sessionStorage.removeItem("jwt");

  await $fetch("/auth/logout", { method: "POST" });

  navigateTo("/login");
}
