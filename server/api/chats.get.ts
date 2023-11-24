import { PrismaClient } from "@prisma/client";

export default defineEventHandler(async (e) => {
	if (!("userId" in e.context.session)) {
		return await sendRedirect(e, "/login");
	}

	const prisma = new PrismaClient();

	return prisma.chat.findMany({
		where: { members: { some: { id: e.context.session.userId } } },
		orderBy: { created: "desc" },
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
});
