import { prisma } from "~/server/db";

export default defineEventHandler(async (e) => {
	if (!("userId" in e.context.session)) {
		return await sendRedirect(e, "/login");
	}

	const query = getQuery(e) as { chatId?: string; deviceId?: string };

	const chatId = query.chatId;
	const deviceId = query.deviceId;

	if (!chatId || !deviceId) {
		setResponseStatus(e, 400);
		return [];
	}

	const messages = await prisma.message.findMany({
		where: {
			chat: {
				id: chatId,
				members: { some: { id: e.context.session.userId } }
			},
			device: { id: deviceId }
		},
		orderBy: { created: "asc" },
		select: {
			id: true,
			content: true,
			created: true,
			sender: {
				select: { username: true }
			}
		}
	});

	return messages;
});
