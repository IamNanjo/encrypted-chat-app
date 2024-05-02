import db from "~/server/db";
import {getSession} from "~/server/session";

export default defineEventHandler(async (e) => {
  const session = await getSession(e);

  if (!("userId" in session.data)) {
    return sendRedirect(e, "/login");
  }

  return db.user.findUnique({
    where: { id: session.data.userId },
    select: {
      id: true,
      username: true,
      created: true,
      devices: {
        orderBy: { lastUsed: "desc" },
        select: {
          id: true,
          name: true,
          lastUsed: true,
        },
      },
    },
  });
});
