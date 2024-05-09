import z from "zod";
import db, { Chat, Message, and, eq } from "~/server/db";
import { getSession } from "~/server/session";

export default defineEventHandler(async (e) => {
  const session = e.context.session;
  if (!session) return sendRedirect(e, "/login");

  const body = await readValidatedBody(
    e,
    z.object({
      chatId: z.number({
        message: "You need to provide a chat ID",
      }),
      messageId: z
        .string({
          message: "You need to provide a message ID",
        })
        .length(36),
    }).parse
  );

  const chat = await db.query.Chat.findFirst({
    where: eq(Chat.id, body.chatId),
    with: { members: { columns: { userId: true } } },
  });

  if (!chat) {
    return setResponseStatus(e, 404, "Chat not found");
  }

  const message = db
    .delete(Message)
    .where(
      and(
        eq(Message.messageId, body.messageId),
        eq(Message.userId, session.data.userId)
      )
    )
    .returning({ messageId: Message.messageId })
    .get();

  if (!message) {
    return setResponseStatus(e, 404, "Message not found");
  }

  if (!global.clients) global.clients = {};
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

  setResponseStatus(e, 204, "Message deleted");
});
