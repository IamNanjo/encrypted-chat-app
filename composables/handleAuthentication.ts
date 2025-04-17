export default function handleAuthentication({
    userId,
    username,
}: {
    userId: AuthenticatedUser["userId"];
    username: AuthenticatedUser["username"];
}) {
    const route = useRoute();
    const auth = useAuth();

    auth.value = {
        authenticated: true,
        userId,
        username,
        currentDevice: auth.value.authenticated
            ? auth.value.currentDevice
            : null,
    };

    navigateTo(route.query.redirect?.toString() ?? "/");
}
