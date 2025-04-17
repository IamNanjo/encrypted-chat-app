const reconnectInterval = 500;
let reconnectAttempts = 0;

export default function startWebsocketConnection() {
    const socket = useSocket();
    const auth = useAuth();
    const authPage = "/login";

    if (!auth.value.authenticated) return navigateTo(authPage);

    const wsProtocol =
        window.location.protocol === "https:" ? "wss://" : "ws://";
    const wsURL = `${wsProtocol}${window.location.host}/ws`;

    if (
        !socket.value ||
        socket.value.readyState === socket.value.CLOSED ||
        socket.value.readyState === socket.value.CLOSING
    ) {
        socket.value = new WebSocket(wsURL);
        socket.value.addEventListener("open", () => (reconnectAttempts = 0));
        socket.value.addEventListener("message", (e) => {
            try {
                if (!auth.value.authenticated) return;

                const message = JSON.parse(e.data) as SocketMessage<Device>;

                if (message.event !== "device" || message.mode !== "delete")
                    return;

                if (message.data.id !== auth.value.currentDevice) return;

                deleteKeyPair(auth.value.userId);
                logOut();
            } catch {
                console.error("[WS] malformed message");
            }
        });
        socket.value.addEventListener("close", (e) => {
            if (auth.value.authenticated && e.code !== 4000) {
                setTimeout(
                    startWebsocketConnection,
                    Math.min(
                        reconnectInterval * ++reconnectAttempts,
                        reconnectInterval * 10,
                    ),
                );
            } else return navigateTo(authPage);
        });
    } else {
        return;
    }
}
