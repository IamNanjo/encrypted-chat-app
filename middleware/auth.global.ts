export default defineNuxtRouteMiddleware(async (to, from) => {
    if (import.meta.server) return;

    const authPage = "/login";
    const fromAuthPage = from.path === authPage;
    const toAuthPage = to.path === authPage;

    // Fix weird UI bug by reloading the app.
    // Always include redirect query parameter when navigating to login route
    if (!fromAuthPage && toAuthPage)
        return reloadNuxtApp({ path: `/login?redirect=${from.path}` });

    const auth = useAuth();

    if (auth.value.authenticated) {
        if (toAuthPage) {
            getKeyPair(auth.value.userId);
            return navigateTo(
                from.query.redirect
                    ? (from.query.redirect as string)
                    : from.path,
            );
        }
    }

    const session = await $fetch("/auth");

    if (!session) {
        return toAuthPage
            ? undefined
            : navigateTo({
                  path: "/login",
                  query: { redirect: from.path },
                  replace: true,
              });
    }

    auth.value = {
        ...session,
        authenticated: true,
        currentDevice: auth.value.authenticated
            ? auth.value.currentDevice
            : null,
    };

    getKeyPair(auth.value.userId);

    const redirect = startWebsocketConnection();
    if (redirect) return redirect;
});
