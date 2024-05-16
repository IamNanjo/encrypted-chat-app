import z from "zod";
import { UAParser } from "ua-parser-js";

import { getSession } from "~/server/session";
import db, { User, Device, eq, lte } from "~/server/db";

export default defineEventHandler(async (e) => {
  const session = e.context.session;
  if (!session) return sendRedirect(e, "/login");

  const userId = session.data.userId;

  const user = db.select().from(User).where(eq(User.id, userId)).get();
  if (!user) {
    e.context.session = null;
    setResponseStatus(e, 401);
    return send(e, "User has been deleted");
  }

  const body = await readValidatedBody(
    e,
    z.object({ key: z.string().min(50) }).parse
  );

  // Get device information for the device name
  const device = new UAParser(getHeader(e, "User-Agent")).getResult();

  const updatedDevice = db
    .insert(Device)
    .values({
      name: `${device.browser.name} ${device.os.name}`,
      key: body.key,
      userId,
    })
    .onConflictDoUpdate({
      target: Device.key,
      set: { lastUsed: new Date() },
    })
    .returning({
      id: Device.id,
      name: Device.name,
      lastUsed: Device.lastUsed,
    })
    .get();

  // Delete devices that have not been used in 60 days
  const sixtyDaysAgo = new Date(Date.now() - 5184000000);
  db.delete(Device).where(lte(Device.lastUsed, sixtyDaysAgo)).run();

  if (!global.clients) global.clients = {};
  if (userId in global.clients) {
    for (const socket of global.clients[userId]) {
      if (socket.readyState !== socket.OPEN) continue;

      socket.send(
        JSON.stringify({
          event: "device",
          mode: "post",
          data: updatedDevice,
        } as SocketMessage<typeof updatedDevice>)
      );
    }
  }

  return updatedDevice.id;
});
