export default () =>
    useState<UnAuthenticatedUser | AuthenticatedUser>("auth", () => ({
        authenticated: false,
    }));
