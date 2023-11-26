import { PrismaClient } from "@prisma/client";

export default defineEventHandler(async (e) => {
	if (!("userId" in e.context.session)) {
		return sendRedirect(e, "/login");
	}

	const prisma = new PrismaClient();

	await prisma.user.delete({ where: { id: e.context.session.userId } });

	e.context.session = null;

	setResponseStatus(e, 204);
	return send(e, "User deleted");
});
