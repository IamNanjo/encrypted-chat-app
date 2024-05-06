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
  const session = await getSession(e);

  if (!("userId" in session.data)) {
    return sendRedirect(e, "/login");
  }

  const body = await readValidatedBody(
    e,
    z.object({
      chat: z.number({ message: "No chat selected" }),
      message: z.string({ message: "No message provided" }),
      deviceId: z.number({ message: "No device ID provided" }),
    }).parse
  );

  const chat = db
    .select()
    .from(Chat)
    .where(
      and(
        eq(Chat.id, body.chat),
        exists(
          db
            .select()
            .from(ChatToUser)
            .where(
              and(
                eq(ChatToUser.chatId, body.chat),
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
      chatId: body.chat,
      deviceId: body.deviceId,
      content: body.message,
    })
    .run().lastInsertRowid;

  const message = db
    .select({
      id: Message.id,
      content: Message.content,
      created: Message.created,
      chatId: Message.chatId,
      deviceId: Message.deviceId,
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

  if (
    recipient &&
    global.clients &&
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
