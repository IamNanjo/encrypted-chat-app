import { PrismaClient } from "@prisma/client";

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

	const prisma = new PrismaClient();
	let chat = null;

	try {
		chat = await prisma.chat.findUnique({ where: { id: chatId } });
	} finally {
		if (!chat) {
			setResponseStatus(e, 404);
			return send(e, "Chat not found - possibly already deleted");
		}
	}

	await prisma.chat.delete({
		where: { id: chatId, members: { some: { id: userId } } }
	});

	hooks.callHook("sse:event", "chats");

	return await send(e);
});
