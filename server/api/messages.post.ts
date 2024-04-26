import db from "~/server/db";
import getSession from "~/server/session";
import type { Message } from "./messages.get";

export default defineEventHandler(async (e) => {
  const session = await getSession(e);

  if (!("userId" in session.data)) {
    return sendRedirect(e, "/login");
  }

  const body = (await readBody(e)) as {
    chat?: Message["chatId"];
    message?: Message["content"];
    deviceId?: Message["deviceId"];
  } | null;

  if (!body || typeof body !== "object" || !("chat" in body) || !body.chat) {
    setResponseStatus(e, 400);
    return send(e, "No chat selected");
  }

  if (!("message" in body) || !body.message) {
    setResponseStatus(e, 400);
    return send(e, "No message provided");
  }

  if (!("deviceId" in body) || !body.deviceId) {
    setResponseStatus(e, 400);
    return send(e, "No device ID provided");
  }

  const chat = await db.chat.findFirst({
    where: {
      id: Number(body.chat),
      members: { some: { id: session.data.userId } },
    },
  });

  if (!chat) {
    setResponseStatus(e, 404);
    return send(e, "Chat not found");
  }

  const message = await db.message.create({
    data: {
      content: body.message,
      chatId: Number(body.chat),
      userId: session.data.userId,
      deviceId: Number(body.deviceId),
    },
    select: {
      id: true,
      content: true,
      created: true,
      chatId: true,
      deviceId: true,
      sender: {
        select: { id: true, username: true },
      },
    },
  });

  const recipient = await db.device.findUnique({
    where: { id: Number(body.deviceId) },
    select: { userId: true },
  });

  if (
    recipient &&
    global.clients &&
    recipient.userId in global.clients &&
    global.clients[recipient.userId]
  ) {
    const recipientSockets = global.clients[recipient.userId];

    for (let i = 0, len = recipientSockets.length; i < len; i++) {
      const socket = recipientSockets[i];

      if (socket.readyState !== socket.OPEN) continue;

      socket.send(
        JSON.stringify({
          event: "message",
          mode: "post",
          data: message,
        } as SocketMessage<Message>)
      );
    }
  }

  setResponseStatus(e, 201);
  return message;
});
