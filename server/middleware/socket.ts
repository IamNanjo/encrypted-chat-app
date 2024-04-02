import WebSocket, { WebSocketServer } from "ws";
import bcrypt from "bcrypt";
import { prisma } from "~/server/db";

interface Clients {
  [id: string]: WebSocket[];
}

declare global {
  var wss: WebSocketServer;
  var clients: Clients;
  interface SocketMessage<T> {
    event: "auth" | "chat" | "message" | "device";
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
      socket.on("message", async (rawMessage) => {
        const message = rawMessage.toString();
        if (message.length < 2) return socket.close(1003);

        const socketMessage = JSON.parse(message) as SocketMessage<
          | {
              userId: number;
              password: string;
            }
          | undefined
        >;

        if (
          !socketMessage.event ||
          !socketMessage.mode ||
          socketMessage.event !== "auth" ||
          socketMessage.mode !== "post" ||
          !socketMessage.data ||
          !socketMessage.data.password
        ) {
          return socket.close(1000);
        }

        const { userId, password } = socketMessage.data;

        if (!userId) return socket.close(1003);

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (!user) return socket.close();

        const passwordMatches = await bcrypt.compare(password, user.password);

        if (!passwordMatches) return socket.close();

        if (!global.clients) global.clients = {};

        if (!(user.id in global.clients)) global.clients[user.id] = [socket];
        else global.clients[user.id].push(socket);

        global.clients[user.id] = global.clients[user.id].filter(
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
