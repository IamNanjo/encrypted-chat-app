import db from "~/server/db";
import getSession from "~/server/session";

export default defineEventHandler(async (e) => {
  const session = await getSession(e);

  if (!("userId" in session.data)) {
    return sendRedirect(e, "/login");
  }

  return db.chat.findMany({
    where: { members: { some: { id: session.data.userId } } },
    orderBy: { created: "desc" },
    select: {
      id: true,
      members: {
        select: {
          id: true,
          username: true,
          devices: {
            select: {
              id: true,
              key: true,
            },
          },
        },
      },
    },
  });
});
