import z from "zod";
import db, { Chat, Message, User, and, eq } from "~/server/db";
import { getSession } from "~/server/session";

export default defineEventHandler(async (e) => {
  const session = await getSession(e);

  if (!("userId" in session.data)) {
    return sendRedirect(e, "/login");
  }

  const body = await readValidatedBody(
    e,
    z.object({
      chat: z.number({
        message: "You need to provide a chat ID",
      }),
      message: z.number({
        message: "You need to provide a message ID",
      }),
    }).parse
  );

  const chat = await db.query.Chat.findFirst({
    where: eq(Chat.id, body.chat),
    with: { members: { columns: { userId: true } } },
  });

  if (!chat) {
    setResponseStatus(e, 404);
    return "Chat not found";
  }

  const message = db
    .delete(Message)
    .where(
      and(eq(Message.id, body.message), eq(Message.userId, session.data.userId))
    )
    .returning({ id: Message.id })
    .get();

  if (!message) {
    return setResponseStatus(e, 404, "Message not found");
  }

  for (const member of chat.members) {
    if (!(member.userId in global.clients)) continue;

    for (const socket of global.clients[member.userId]) {
      if (socket.readyState !== socket.OPEN) continue;

      socket.send(
        JSON.stringify({
          event: "message",
          mode: "delete",
          data: message,
        } as SocketMessage<typeof message>)
      );
    }
  }

  setResponseStatus(e, 204);
  return message;
});
