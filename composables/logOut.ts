export default async function logOut() {
  const auth = useAuth();
  const socket = useSocket();

  if (socket.value) socket.value.close();

  auth.value = { authenticated: false };
  sessionStorage.removeItem("jwt");

  await $fetch("/auth/logout", { method: "POST" });

  clearNuxtData();
  clearNuxtState();
  navigateTo("/login");
}
