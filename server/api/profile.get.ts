import { prisma } from "~/server/db";

export default defineEventHandler(async (e) => {
	if (!("userId" in e.context.session)) {
		return await sendRedirect(e, "/login");
	}

	return prisma.user.findUnique({
		where: { id: e.context.session.userId },
		select: {
			id: true,
			username: true,
			created: true,
			devices: {
				orderBy: { lastUsed: "desc" },
				select: {
					id: true,
					name: true,
					lastUsed: true
				}
			}
		}
	});
});
