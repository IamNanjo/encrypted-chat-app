import { prisma } from "~/server/db";

export interface Chat {
  id: number;
  members: {
    id: number;
    username: string;
    devices: { id: number; key: string }[];
  }[];
}

export default defineEventHandler(async (e) => {
  if (!("userId" in e.context.session)) {
    return await sendRedirect(e, "/login");
  }

  const body = (await readBody(e)) as {
    user?: Chat["members"][0]["id"];
  } | null;

  if (!body || typeof body !== "object" || !("user" in body) || !body.user) {
    setResponseStatus(e, 400);
    return send(e, "No user selected");
  }

  if (body.user === e.context.session.userId) {
    setResponseStatus(e, 400);
    return send(e, "You cannot start a chat with yourself");
  }

  const chatMemberIds = [e.context.session.userId, body.user];

  // Users are not the same for the existing chat and the new one
  if (
    existingChat &&
    (existingChat.members.length === 2 ||
      existingChat.members.every((member) => chatMemberIds.includes(member.id)))
  ) {
    setResponseStatus(e, 409);
    return send(e, "Chat already exists");
  }

  const chat = await prisma.chat.create({
    data: {
      members: {
        connect: [{ id: e.context.session.userId }, { id: body.user }],
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
