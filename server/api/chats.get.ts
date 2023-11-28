import { prisma } from "~/server/db";

export default defineEventHandler(async (e) => {
	if (!("userId" in e.context.session)) {
		return await sendRedirect(e, "/login");
	}

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
