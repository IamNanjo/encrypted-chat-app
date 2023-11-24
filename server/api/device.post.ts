import { PrismaClient } from "@prisma/client";

export default defineEventHandler(async (e) => {
	if (!("userId" in e.context.session)) {
		return await sendRedirect(e, "/login");
	}

	const userId = e.context.session.userId;
	const body = (await readBody(e)) as { key?: string };

	if (!body || !("key" in body) || !body.key) {
		setResponseStatus(e, 400);
		return await send(e, "Public key missing from the request");
	}

	const ua = getHeader(e, "User-Agent") || "Unknown device";

	const prisma = new PrismaClient();

	// Add new device for the user or update the lastUsed date
	return prisma.device.upsert({
		where: { key: body.key },
		create: { name: ua, key: body.key, user: { connect: { id: userId } } },
		update: { lastUsed: new Date() }
	});
});
