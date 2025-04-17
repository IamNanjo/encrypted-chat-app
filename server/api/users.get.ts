import z from "zod";
import db, { User, and, ne, like } from "~/server/db";

export default defineEventHandler(async (e) => {
    const session = e.context.session;
    if (!session) return sendRedirect(e, "/login");

    const query = await getValidatedQuery(
        e,
        z.object({ q: z.string().default("") }).parse,
    );

    const notCurrentUser = ne(User.id, session.data.userId);

    return db
        .select({ id: User.id, username: User.username })
        .from(User)
        .where(
            !query.q
                ? notCurrentUser
                : and(notCurrentUser, like(User.username, `%${query.q}%`)),
        )
        .all();
});
