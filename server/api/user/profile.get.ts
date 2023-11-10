import { PrismaClient } from "@prisma/client";

defineEventHandler(async (e) => {
	if (!("userId" in e.context.session)) {
		setResponseStatus(e, 401);
		return send(e, "You must be logged in to access this resource");
	}

	const prisma = new PrismaClient();

	const profile = await prisma.user.findUnique({
		where: { id: e.context.session.userId },
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
