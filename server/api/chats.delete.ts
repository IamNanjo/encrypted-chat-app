import db from "~/server/db";
import getSession from "~/server/session";
import type { Chat } from "./chats.post";

export default defineEventHandler(async (e) => {
  const session = await getSession(e);

  if (!("userId" in session.data)) {
    return sendRedirect(e, "/login");
  }

  const body = (await readBody(e)) as { id?: number } | null;

  if (!body || !body.id || !Number(body.id)) {
    setResponseStatus(e, 400);
    return "No chat ID provided";
  }

  const userId = Number(session.data.userId);
  const chatId = Number(body.id);

  let chat = null;

  try {
    chat = await db.chat.findUnique({ where: { id: chatId } });
  } finally {
    if (!chat) {
      setResponseStatus(e, 404);
      return "Chat not found - possibly already deleted";
    }
  }

  chat = await db.chat.delete({
    where: { id: chatId, members: { some: { id: userId } } },
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

  if (global.clients) {
    for (const member of chat.members) {
      if (!(member.id in global.clients)) continue;

      for (const socket of global.clients[member.id]) {
        if (socket.readyState !== socket.OPEN) continue;

        socket.send(
          JSON.stringify({
            event: "chat",
            mode: "delete",
            data: chat,
          } as SocketMessage<Chat>)
        );
      }
    }
  }

  return e;
});
