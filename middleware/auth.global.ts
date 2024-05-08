export default defineNuxtRouteMiddleware(async (to, from) => {
  if (process.server) return;

  const authPage = "/login";

  const fromAuthPage = from.path === authPage;
  const toAuthPage = to.path === authPage;

  if (fromAuthPage && toAuthPage) return abortNavigation();
  if (!fromAuthPage && toAuthPage) return;

  const session = await $fetch("/auth");
  const token = sessionStorage.getItem("jwt");

  const auth = useAuth();

  if ((!session || !token) && !toAuthPage) return navigateTo(authPage);
  if (!session) return;

  if (!token) return navigateTo(authPage);

  auth.value = {
    ...session, // userId and username
    token,
    authenticated: true,
    currentDevice: auth.value.authenticated ? auth.value.currentDevice : null,
  };

  getKeyPair(auth.value.userId);

  const redirect = startWebsocketConnection();
  if (redirect) return redirect;

  if (toAuthPage) return navigateTo("/");
});
