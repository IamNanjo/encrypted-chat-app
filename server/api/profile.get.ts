import db, { User, eq } from "~/server/db";

export function getProfileWithDevices(userId: number) {
    return db.query.User.findFirst({
        where: eq(User.id, userId),
        columns: { id: true, username: true, created: true },
        with: {
            devices: {
                columns: { id: true, name: true, lastUsed: true },
            },
        },
    });
}

export default defineEventHandler(async (e) => {
    const session = e.context.session;
    if (!session) return sendRedirect(e, "/login");

    return getProfileWithDevices(session.data.userId);
});
