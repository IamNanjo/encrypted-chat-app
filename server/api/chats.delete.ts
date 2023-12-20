import { prisma } from "~/server/db";
import type { Chat } from "./chats.post";

export default defineEventHandler(async (e) => {
	if (!("userId" in e.context.session)) {
		return sendRedirect(e, "/login");
	}

	const body = (await readBody(e)) as { id?: string } | null;

	if (!body || !body.id || typeof body.id !== "string") {
		setResponseStatus(e, 400);
		return send(e, "No chat ID provided");
	}

	const userId = e.context.session.userId;
	const chatId = body.id;

	let chat = null;

	try {
		chat = await prisma.chat.findUnique({ where: { id: chatId } });
	} finally {
		if (!chat) {
			setResponseStatus(e, 404);
			return send(e, "Chat not found - possibly already deleted");
		}
	}

	chat = await prisma.chat.delete({
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
							key: true
						}
					}
				}
			}
		}
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
						data: chat
					} as SocketMessage<Chat>)
				);
			}
		}
	}

	return await send(e);
});
