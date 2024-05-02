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
  const socket = useSocket();

  sessionStorage.setItem("jwt", token);

  auth.value = {
    authenticated: true,
    token,
    userId,
    username,
    currentDevice: auth.value.authenticated ? auth.value.currentDevice : null,
  };

  if (!socket.value) return;

  const wsAuthenticate = (socket: WebSocket) => {
    window.setTimeout(() => {
      if (socket.readyState !== socket.OPEN) return wsAuthenticate(socket);

      if (!auth.value.authenticated) return;

      socket.send(
        JSON.stringify({
          event: "auth",
          mode: "post",
          data: token,
        } as SocketMessage<string>)
      );

      return navigateTo("/");
    }, 100);
  };

  wsAuthenticate(socket.value);
}
