import { prisma } from "~/server/db";
import { UAParser } from "ua-parser-js";

export default defineEventHandler(async (e) => {
	if (!("userId" in e.context.session)) {
		return await sendRedirect(e, "/login");
	}

	const userId = e.context.session.userId;

	const user = await prisma.user.findUnique({ where: { id: userId } });
	if (!user) {
		e.context.session = null;
		setResponseStatus(e, 401);
		return send(e, "User has been deleted");
	}

	const body = (await readBody(e)) as { key?: string };

	if (!body || !("key" in body) || !body.key) {
		setResponseStatus(e, 400);
		return await send(e, "Public key missing from the request");
	}

	// Get device information for the device name
	const device = new UAParser(getHeader(e, "User-Agent")).getResult();

	// Delete devices that have not been used in 7 days
	const oneWeekAgo = new Date(Date.now() - 604800000);
	await prisma.device.deleteMany({ where: { lastUsed: { lte: oneWeekAgo } } });

	const updatedDevice = prisma.device.upsert({
		where: { key: body.key },
		create: {
			name: `${device.browser.name} ${device.os.name}`,
			key: body.key,
			user: {
				connect: { id: userId }
			}
		},
		update: { lastUsed: new Date() },
		select: {
			id: true,
			name: true,
			key: true,
			lastUsed: true
		}
	});

	return updatedDevice;
});
