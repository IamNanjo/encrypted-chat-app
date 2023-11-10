import { PrismaClient } from "@prisma/client";

export default defineEventHandler(async (e) => {
	const query = getQuery(e) as { chatId?: string; key?: string };

	const chatId = query.chatId?.toString();
	const key = query.key?.toString();

	if (!chatId || !key) return [];

	if (!("userId" in e.context.session)) {
		return await sendRedirect(e, "/login");
	}

	const prisma = new PrismaClient();

	const messages = await prisma.message.findMany({
		where: {
			chat: {
				id: chatId,
				members: { some: { id: e.context.session.userId } }
			},
			device: { key }
		}
	});

	return messages;
});
