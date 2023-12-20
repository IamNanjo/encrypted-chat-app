import { prisma } from "~/server/db";

export interface Device {
	id: string;
	name: string;
	key: string;
	lastUsed: Date;
}

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

	const device = await prisma.device.delete({
		where: { id: deviceId, userId },
		select: {
			id: true,
			name: true,
			key: true,
			lastUsed: true
		}
	});

	if (global.clients && userId in global.clients) {
		for (const socket of global.clients[userId]) {
			if (socket.readyState !== socket.OPEN) continue;

			socket.send(
				JSON.stringify({
					event: "device",
					mode: "delete",
					data: device
				} as SocketMessage<Device>)
			);
		}
	}

	setResponseStatus(e, 204);
	return device;
});
