import { prisma } from "~/server/db";
import { Message } from "./messages.get";

export default defineEventHandler(async (e) => {
	if (!("userId" in e.context.session)) {
		return await sendRedirect(e, "/login");
	}

	const body = (await readBody(e)) as {
		chat?: string;
		message?: string;
	} | null;

	if (
		!body ||
		typeof body !== "object" ||
		Array.isArray(body) ||
		!body.message ||
		!String(body.chat) ||
		!String(body.message)
	) {
		setResponseStatus(e, 400);
		return "You need to provide a chat ID and message ID";
	}

	const chat = await prisma.chat.findUnique({
		where: { id: body.chat },
		include: { members: true }
	});

	if (!chat) {
		setResponseStatus(e, 404);
		return "Chat not found";
	}

	const message = await prisma.message.delete({
		where: { id: body.message, sender: { id: e.context.session.userId } },
		select: {
			id: true,
			content: true,
			created: true,
			sender: {
				select: { id: true, username: true }
			}
		}
	});

	for (const member of chat.members) {
		if (!(member.id in global.clients)) continue;

		for (const socket of global.clients[member.id]) {
			if (socket.readyState !== socket.OPEN) continue;

			socket.send(
				JSON.stringify({
					event: "message",
					mode: "delete",
					data: message
				} as SocketMessage<Message>)
			);
		}
	}

	setResponseStatus(e, 204);
	return message;
});
