import z from "zod";
import db, { User, and, ne, ilike } from "~/server/db";
import { getSession } from "~/server/session";

export default defineEventHandler(async (e) => {
  const session = await getSession(e);

  if (!("userId" in session.data)) {
    return sendRedirect(e, "/login");
  }

  const query = await getValidatedQuery(
    e,
    z.object({ q: z.string().default("") }).parse
  );

  const notCurrentUser = ne(User.id, session.data.userId);

  return db
    .select({ id: User.id, username: User.username })
    .from(User)
    .where(
      !query.q
        ? notCurrentUser
        : and(notCurrentUser, ilike(User.username, `%${query.q}%`))
    )
    .all();
});
