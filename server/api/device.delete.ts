import { prisma } from "~/server/db";

export default defineEventHandler(async (e) => {
	if (!("userId" in e.context.session)) {
		return await sendRedirect(e, "/login");
	}

	const userId = e.context.session.userId;
	const body = (await readBody(e)) as { deviceId?: string } | null;

	if (
		!body ||
		typeof body !== "object" ||
		Array.isArray(body) ||
		!("deviceId" in body)
	) {
		setResponseStatus(e, 400);
		return "Request is missing the device ID";
	}

	const deviceId = body.deviceId;

    setResponseStatus(e, 204);
	return await prisma.device.delete({ where: { id: deviceId, userId } });
});
