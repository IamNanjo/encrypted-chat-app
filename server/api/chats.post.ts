import z from "zod";
import db, { Chat, ChatToUser, eq } from "~/server/db";
import { getSession } from "~/server/session";

import type { RawChat } from "~/server/api/chats.get";

export default defineEventHandler(async (e) => {
  const session = await getSession(e);

  if (!("userId" in session.data)) {
    return sendRedirect(e, "/login");
  }

  const body = await readValidatedBody(e, z.object({ user: z.number() }).parse);

  if (body.user === session.data.userId) {
    return setResponseStatus(e, 400, "You cannot start a chat with yourself");
  }

  const chatUsers = [session.data.userId, body.user];

  const newChat = db.insert(Chat).values({}).returning({ id: Chat.id }).get();

  for (const chatUser of chatUsers) {
    db.insert(ChatToUser)
      .values({ chatId: newChat.id, userId: chatUser })
      .run();
  }

  const chatRow = await db.query.Chat.findFirst({
    where: eq(Chat.id, newChat.id),
    columns: { id: true },
    with: {
      members: {
        columns: {},
        with: {
          user: {
            columns: { id: true, username: true },
            with: { devices: { columns: { id: true, key: true } } },
          },
        },
      },
    },
  });

  if (!chatRow || !chatRow.members || !chatRow.members.length) {
    return setResponseStatus(e, 500, "Chat creation failed");
  }

  const chat: RawChat = {
    id: chatRow.id,
    members: chatRow.members.map(({ user }) => user),
  };

  setResponseStatus(e, 201, "Chat created");

  for (const member of chat.members) {
    if (!member || !(member.id in global.clients)) continue;

    for (const socket of global.clients[member.id]) {
      if (socket.readyState !== socket.OPEN) continue;

      socket.send(
        JSON.stringify({
          event: "chat",
          mode: "post",
          data: chat,
        } as SocketMessage<typeof chat>)
      );
    }
  }

  return chat;
});
