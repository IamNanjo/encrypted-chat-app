import { PrismaClient } from "@prisma/client";

export default defineEventHandler((e) => {
	const prisma = new PrismaClient();

	const query = getQuery(e) as { q?: string };

	return prisma.user.findMany({
		where: { username: { contains: query.q || "" } },
		select: { id: true, username: true }
	});
});
