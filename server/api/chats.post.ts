import db from "~/server/db";
import getSession from "~/server/session";

export interface Chat {
  id: number;
  members: {
    id: number;
    username: string;
    devices: { id: number; key: string }[];
  }[];
}

export default defineEventHandler(async (e) => {
  const session = await getSession(e);

  if (!("userId" in session.data)) {
    return sendRedirect(e, "/login");
  }

  const body = (await readBody(e)) as {
    user?: Chat["members"][0]["id"];
  } | null;

  if (!body || typeof body !== "object" || !("user" in body) || !body.user) {
    setResponseStatus(e, 400);
    return send(e, "No user selected");
  }

  if (body.user === session.data.userId) {
    setResponseStatus(e, 400);
    return send(e, "You cannot start a chat with yourself");
  }

  const chat = await db.chat.create({
    data: {
      members: {
        connect: [{ id: session.data.userId }, { id: body.user }],
      },
    },
    select: {
      id: true,
      members: {
        select: {
          id: true,
          username: true,
          devices: {
            select: {
              id: true,
              key: true,
            },
          },
        },
      },
    },
  });

  for (const member of chat.members) {
    if (!(member.id in global.clients)) continue;

    for (const socket of global.clients[member.id]) {
      if (socket.readyState !== socket.OPEN) continue;

      socket.send(
        JSON.stringify({
          event: "chat",
          mode: "post",
          data: chat,
        } as SocketMessage<Chat>)
      );
    }
  }

  setResponseStatus(e, 201);
  return chat;
});
