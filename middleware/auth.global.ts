export default defineNuxtRouteMiddleware(async (to, from) => {
  const authPage = "/login";
  const fromAuthPage = from.path === authPage;
  const toAuthPage = to.path === authPage;

  if (fromAuthPage && toAuthPage) return;
  if (!fromAuthPage && toAuthPage) return;

  const auth = useAuth();

  const session = await $fetch("/auth");

  if (!session || process.server)
    return toAuthPage ? undefined : navigateTo(authPage);

  const token = sessionStorage.getItem("jwt");

  if (!token && !toAuthPage) return navigateTo(authPage);
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
