export default function startWebsocketConnection() {
  const socket = useSocket();
  const auth = useAuth();
  const authPage = "/login";

  if (!auth.value.authenticated || !auth.value.token)
    return navigateTo(authPage);

  const authenticated = auth.value.authenticated;
  const token = auth.value.token;

  const wsProtocol = window.location.protocol === "https:" ? "wss://" : "ws://";
  const wsURL = `${wsProtocol}${window.location.host}`;

  if (
    !socket.value ||
    socket.value.readyState === socket.value.CLOSED ||
    socket.value.readyState === socket.value.CLOSING
  ) {
    socket.value = new WebSocket(wsURL);
    socket.value.addEventListener("close", () => {
      if (authenticated && token) startWebsocketConnection();
      else return navigateTo(authPage);
    });
  } else {
    return;
  }

  socket.value.addEventListener("message", async (e) => {
    const { event, mode } = JSON.parse(e.data) as SocketMessage<any>;

    if (event !== "auth" || mode !== "delete") return;

    await logOut();
    navigateTo(authPage);
  });

  socket.value.addEventListener("open", () => {
    socket.value!.send(
      JSON.stringify({
        event: "auth",
        mode: "post",
        data: token,
      } as SocketMessage<string>)
    );
  });
}
