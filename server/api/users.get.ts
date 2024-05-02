import db from "~/server/db";
import {getSession} from "~/server/session";

export default defineEventHandler(async (e) => {
  const session = await getSession(e);

  if (!("userId" in session.data)) {
    return sendRedirect(e, "/login");
  }

  const query = getQuery(e) as { q?: string };

  return db.user.findMany({
    where: {
      id: { not: session.data.userId },
      username: { contains: query.q || "" },
    },
    select: { id: true, username: true },
  });
});
