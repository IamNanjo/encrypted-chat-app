import db, { User, eq } from "~/server/db";
import { getSession } from "~/server/session";

export default defineEventHandler(async (e) => {
  const session = await getSession(e);

  if (!("userId" in session.data)) {
    return sendRedirect(e, "/login");
  }

  return await Promise.all([
    db.delete(User).where(eq(User.id, session.data.userId)),
    session.clear(),
  ])
    .then(() => setResponseStatus(e, 204, "User deleted"))
    .catch(() => setResponseStatus(e, 400));
});
