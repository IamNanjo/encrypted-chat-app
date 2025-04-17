import { getSession } from "~/server/session";
import type { SessionData } from "~/server/session";

declare global {
    var clients: {
        [userId: number]: {
            [peerId: string]: Partial<WebSocket>;
        };
    };
    interface SocketMessage<T> {
        event: "ping" | "auth" | "chat" | "message" | "device";
        mode: "post" | "delete";
        data: T;
    }
}

export default defineWebSocketHandler({
    // Attach session information to websocket context
    async upgrade(req) {
        const session = await getSession(req);
        if (!session.data) return Response.redirect("/login", 301);
        req.context.session = session.data;
    },

    // Add opened socket to global WS clients and ping clients to keep connection open
    open(peer) {
        const { userId } = peer.context.session as SessionData;

        if (!global.clients) global.clients = {};
        if (!global.clients[userId]) global.clients[userId] = {};

        global.clients[userId][peer.id] = peer;

        peer.context.pingInterval = setInterval(() => {
            peer.send(
                JSON.stringify({
                    event: "ping",
                    mode: "post",
                } as SocketMessage<undefined>),
            );
        }, 30000);
    },

    // Remove closed socket from global WS clients
    close(peer, details) {
        clearInterval(
            peer.context.pingInterval as Parameters<typeof clearInterval>[0],
        );
        peer;
        details;
    },

    error(_, err) {
        console.error(`WS error: ${err.message}`);
    },
});
