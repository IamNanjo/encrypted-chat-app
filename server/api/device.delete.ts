import z from "zod";
import db, { Device, and, eq } from "~/server/db";
import { getSession } from "~/server/session";

export interface Device {
    id: number;
    name: string;
    key: string;
    lastUsed: Date;
}

export default defineEventHandler(async (e) => {
    const session = e.context.session;
    if (!session) return sendRedirect(e, "/login");

    const userId = Number(session.data.userId);
    const body = await readValidatedBody(
        e,
        z.object({
            deviceId: z
                .number({ message: "Request is missing the device ID" })
                .int(),
        }).parse,
    );

    const deviceId = body.deviceId;

    const device = await db
        .delete(Device)
        .where(and(eq(Device.id, deviceId), eq(Device.userId, userId)))
        .returning({
            id: Device.id,
            name: Device.name,
            key: Device.key,
            lastUsed: Device.lastUsed,
        })
        .get();

    if (!global.clients) global.clients = {};
    if (userId in global.clients) {
        for (const socket of Object.values(global.clients[userId])) {
            if (socket.readyState !== socket.OPEN) continue;

            socket.send!(
                JSON.stringify({
                    event: "device",
                    mode: "delete",
                    data: device,
                } as SocketMessage<Device>),
            );
        }
    }

    setResponseStatus(e, 204);
    return device;
});
