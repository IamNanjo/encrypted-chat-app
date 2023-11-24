import { PrismaClient } from "@prisma/client";

export default defineEventHandler(async (e) => {
	if (!("userId" in e.context.session)) {
		return await sendRedirect(e, "/login");
	}

	const prisma = new PrismaClient();

	const profile = await prisma.user.findMany({
		// where: { id: e.context.session.userId },
		select: {
			id: true,
			username: true,
			created: true,
			devices: {
				select: {
					id: true,
					name: true,
					lastUsed: true
				}
			}
		}
	});

	return profile;
});
