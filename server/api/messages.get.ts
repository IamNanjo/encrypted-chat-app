import { prisma } from "~/server/db";

export interface Message {
  id: number;
  content: string;
  created: Date;
  chatId: number;
  deviceId: number;
  sender: {
    id: number;
    username: string;
  };
}

export default defineEventHandler(async (e) => {
  if (!("userId" in e.context.session)) {
    return await sendRedirect(e, "/login");
  }

  const query = getQuery(e) as {
    chatId?: Message["chatId"];
    deviceId?: Message["deviceId"];
  };

  const chatId = query.chatId;
  const deviceId = query.deviceId;

  if (!chatId || !deviceId) {
    setResponseStatus(e, 400);
    return [] as Message[];
  }

  const messages = await prisma.message.findMany({
    where: {
      chat: {
        id: Number(chatId),
        members: { some: { id: e.context.session.userId } },
      },
      device: { id: Number(deviceId) },
    },
    orderBy: { created: "asc" },
    select: {
      id: true,
      content: true,
      created: true,
      sender: {
        select: { id: true, username: true },
      },
    },
  });

  return messages;
});
