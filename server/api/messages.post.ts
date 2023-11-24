import { PrismaClient } from "@prisma/client";

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

	const prisma = new PrismaClient();

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

	await prisma.message.create({
		data: {
			content: body.message,
			chatId: body.chat,
			userId: e.context.session.userId,
			deviceId: body.deviceId
		}
	});

	hooks.callHook("sse:event", "messages");

	setResponseStatus(e, 201);
	return await send(e);
});
