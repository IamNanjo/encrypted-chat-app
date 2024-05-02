import db from "~/server/db";
import {getSession} from "~/server/session";

export interface Device {
  id: number;
  name: string;
  key: string;
  lastUsed: Date;
}

export default defineEventHandler(async (e) => {
  const session = await getSession(e);

  if (!("userId" in session.data)) {
    return sendRedirect(e, "/login");
  }

  const userId = Number(session.data.userId);
  const body = (await readBody(e)) as { deviceId?: Device["id"] } | null;

  if (
    !body ||
    typeof body !== "object" ||
    Array.isArray(body) ||
    !("deviceId" in body)
  ) {
    setResponseStatus(e, 400);
    return "Request is missing the device ID";
  }

  const deviceId = Number(body.deviceId);

  const device = await db.device.delete({
    where: { id: Number(deviceId), userId },
    select: {
      id: true,
      name: true,
      key: true,
      lastUsed: true,
    },
  });

  if (global.clients && userId in global.clients) {
    for (const socket of global.clients[userId]) {
      if (socket.readyState !== socket.OPEN) continue;

      socket.send(
        JSON.stringify({
          event: "device",
          mode: "delete",
          data: device,
        } as SocketMessage<Device>)
      );
    }
  }

  setResponseStatus(e, 204);
  return device;
});
