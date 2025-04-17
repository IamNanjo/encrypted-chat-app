import db, { User, eq } from "~/server/db";

export default defineEventHandler(async (e) => {
    const session = e.context.session;
    if (!session) return sendRedirect(e, "/login");

    return await Promise.all([
        db.delete(User).where(eq(User.id, session.data.userId)).run(),
        session.clear(),
    ])
        .then(() => setResponseStatus(e, 204, "User deleted"))
        .catch(() => setResponseStatus(e, 400));
});
