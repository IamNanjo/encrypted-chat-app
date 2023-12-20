import { prisma } from "~/server/db";
import type { Message } from "./messages.get";

export default defineEventHandler(async (e) => {
	if (!("userId" in e.context.session)) {
		return await sendRedirect(e, "/login");
	}

	const body = (await readBody(e)) as {
		chat: string;
		message: string;
		deviceId: string;
	} | null;

	if (
		!body ||
		typeof body !== "object" ||
		!("chat" in body) ||
		!body.chat ||
		!body.chat.toString()
	) {
		setResponseStatus(e, 400);
		return send(e, "No chat selected");
	}

	if (!("message" in body) || !body.message || !body.message.toString()) {
		setResponseStatus(e, 400);
		return send(e, "No message provided");
	}

	if (!("deviceId" in body) || !body.deviceId || !body.deviceId.toString()) {
		setResponseStatus(e, 400);
		return send(e, "No device ID provided");
	}

	const chat = await prisma.chat.findFirst({
		where: {
			id: body.chat,
			members: { some: { id: e.context.session.userId } }
		}
	});

	if (!chat) {
		setResponseStatus(e, 404);
		return send(e, "Chat not found");
	}

	const message = await prisma.message.create({
		data: {
			content: body.message,
			chatId: body.chat,
			userId: e.context.session.userId,
			deviceId: body.deviceId
		},
		select: {
			id: true,
			content: true,
			created: true,
			chatId: true,
			deviceId: true,
			sender: {
				select: { id: true, username: true }
			}
		}
	});

	const recipient = await prisma.device.findUnique({
		where: { id: body.deviceId },
		select: { userId: true }
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
					data: message
				} as SocketMessage<Message>)
			);
		}
	}

	setResponseStatus(e, 201);
	return message;
});
