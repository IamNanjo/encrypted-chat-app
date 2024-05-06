import type { AuthenticatedUser } from "./useAuth";

export default function handleAuthentication({
  token,
  userId,
  username,
}: {
  token: string;
  userId: AuthenticatedUser["userId"];
  username: AuthenticatedUser["username"];
}) {
  const auth = useAuth();

  sessionStorage.setItem("jwt", token);

  auth.value = {
    authenticated: true,
    token,
    userId,
    username,
    currentDevice: auth.value.authenticated ? auth.value.currentDevice : null,
  };

  return navigateTo("/");
}
