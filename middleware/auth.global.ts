export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return;

  const auth = useAuth();

  const authPages = ["/login", "/register"];
  const toAuthPage = authPages.includes(to.path);
  const session = await $fetch("/auth");

  if (!session && !toAuthPage) return navigateTo("/login");
  if (!session) return;

  const token = sessionStorage.getItem("jwt");
  if (!token) return navigateTo("/login");

  auth.value = {
    ...session, // userId and username
    token,
    authenticated: true,
    currentDevice: auth.value.authenticated ? auth.value.currentDevice : null,
  };

  getKeyPair(auth.value.userId);
  await startWebsocketConnection();

  if (toAuthPage) return navigateTo("/");
});
