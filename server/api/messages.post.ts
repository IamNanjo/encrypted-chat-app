import z from "zod";
import db, {
  Chat,
  ChatToUser,
  Device,
  Message,
  User,
  and,
  eq,
  exists,
} from "~/server/db";
import { getSession } from "~/server/session";

export default defineEventHandler(async (e) => {
  const session = e.context.session;
  if (!session) return sendRedirect(e, "/login");

  const body = await readValidatedBody(
    e,
    z.object({
      chatId: z.number({ message: "No chat ID provided" }),
      deviceId: z.number({ message: "No device ID provided" }),
      messageId: z.string({ message: "No message ID provided" }).length(36),
      message: z.string({ message: "No message provided" }),
    }).parse
  );

  const chat = db
    .select()
    .from(Chat)
    .where(
      and(
        eq(Chat.id, body.chatId),
        exists(
          db
            .select()
            .from(ChatToUser)
            .where(
              and(
                eq(ChatToUser.chatId, body.chatId),
                eq(ChatToUser.userId, session.data.userId)
              )
            )
        )
      )
    )
    .get();

  if (!chat) {
    setResponseStatus(e, 404);
    return send(e, "Chat not found");
  }

  const messageId = db
    .insert(Message)
    .values({
      userId: session.data.userId,
      chatId: body.chatId,
      deviceId: body.deviceId,
      messageId: body.messageId,
      content: body.message,
    })
    .run().lastInsertRowid;

  const message = db
    .select({
      id: Message.id,
      chatId: Message.chatId,
      deviceId: Message.deviceId,
      messageId: Message.messageId,
      content: Message.content,
      created: Message.created,
      sender: {
        id: User.id,
        username: User.username,
      },
    })
    .from(Message)
    .innerJoin(User, eq(Message.userId, User.id))
    .where(eq(Message.id, messageId as number))
    .get();

  if (!message) return setResponseStatus(e, 500, "Message creation failed");

  const recipient = db
    .select({ id: User.id })
    .from(Device)
    .where(eq(Device.id, message.deviceId))
    .leftJoin(User, eq(Device.userId, User.id))
    .get();

  if (!global.clients) global.clients = {};
  if (
    recipient &&
    recipient.id &&
    recipient.id in global.clients &&
    global.clients[recipient.id]
  ) {
    const recipientSockets = global.clients[recipient.id];

    for (let i = 0, len = recipientSockets.length; i < len; i++) {
      const socket = recipientSockets[i];

      if (socket.readyState !== socket.OPEN) continue;

      socket.send(
        JSON.stringify({
          event: "message",
          mode: "post",
          data: message,
        } as SocketMessage<typeof message>)
      );
    }
  }

  setResponseStatus(e, 201);
  return message;
});
