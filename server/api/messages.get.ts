import db from "~/server/db";
import getSession from "~/server/session";

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
 const session = await getSession(e);

 if (!("userId" in session.data)) {
   return sendRedirect(e, "/login");
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

  const messages = await db.message.findMany({
    where: {
      chat: {
        id: Number(chatId),
        members: { some: { id: session.data.userId } },
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
