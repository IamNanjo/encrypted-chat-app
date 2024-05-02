import WebSocket, { WebSocketServer } from "ws";
import { verifyJWT } from "~/server/session";

interface Clients {
  [id: number]: WebSocket[];
}

declare global {
  var wss: WebSocketServer;
  var clients: Clients;
  interface SocketMessage<T> {
    event: "ping" | "auth" | "chat" | "message" | "device";
    mode: "post" | "delete";
    data: T;
  }
}

let wss: WebSocketServer;

export default defineEventHandler((e) => {
  if (!global.wss) {
    wss = new WebSocketServer({
      server: (e.node.res.socket as any)?.server,
    });
    wss.on("connection", (socket) => {
      // Ping the client to keep the socket open
      const pingInterval = setInterval(() => {
        socket.send(
          JSON.stringify({
            event: "ping",
            mode: "post",
            data: null,
          } as SocketMessage<null>)
        );
      }, 30000);

      socket.on("close", async () => clearInterval(pingInterval));

      socket.on("message", async (rawMessage) => {
        const message = rawMessage.toString();
        let socketMessage = null;

        try {
          socketMessage = JSON.parse(message) as SocketMessage<
            string | undefined
          >;
        } catch {
          return socket.close(1003);
        }

        if (
          !socketMessage.event ||
          !socketMessage.mode ||
          socketMessage.event !== "auth" ||
          socketMessage.mode !== "post" ||
          !socketMessage.data
        ) {
          return socket.close(1000);
        }

        const token = socketMessage.data;
        const user = verifyJWT(token);

        if (!user) return socket.close();

        if (!global.clients) global.clients = {};

        if (!(user.userId in global.clients))
          global.clients[user.userId] = [socket];
        else global.clients[user.userId].push(socket);

        global.clients[user.userId] = global.clients[user.userId].filter(
          (client) => client.readyState === client.OPEN
        );

        socket.send(
          JSON.stringify({
            event: "auth",
            mode: "post",
            data: `Authenticated as ${user.username}`,
          })
        );
      });
    });
    global.wss = wss;
  }
});
