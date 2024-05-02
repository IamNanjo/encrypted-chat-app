import db from "~/server/db";
import {getSession} from "~/server/session";
import { UAParser } from "ua-parser-js";
import type { Device } from "./device.delete";

export default defineEventHandler(async (e) => {
  const session = await getSession(e);

  if (!("userId" in session.data)) {
    return sendRedirect(e, "/login");
  }

  const userId = session.data.userId;

  const user = await db.user.findUnique({ where: { id: userId } });
  if (!user) {
    e.context.session = null;
    setResponseStatus(e, 401);
    return send(e, "User has been deleted");
  }

  const body = (await readBody(e)) as { key?: Device["key"] };

  if (!body || !("key" in body) || !body.key) {
    setResponseStatus(e, 400);
    return send(e, "Public key missing from the request");
  }

  // Get device information for the device name
  const device = new UAParser(getHeader(e, "User-Agent")).getResult();

  // Delete devices that have not been used in 7 days
  const oneWeekAgo = new Date(Date.now() - 604800000);
  await db.device.deleteMany({ where: { lastUsed: { lte: oneWeekAgo } } });

  const updatedDevice = await db.device.upsert({
    where: { key: body.key },
    create: {
      name: `${device.browser.name} ${device.os.name}`,
      key: body.key,
      user: {
        connect: { id: userId },
      },
    },
    update: { lastUsed: new Date() },
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
          mode: "post",
          data: updatedDevice,
        } as SocketMessage<Device>)
      );
    }
  }

  return updatedDevice;
});
