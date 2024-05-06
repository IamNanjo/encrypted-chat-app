import db, { User, Device, eq, desc } from "~/server/db";
import { getSession } from "~/server/session";

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
  const session = await getSession(e);

  if (!("userId" in session.data)) {
    return sendRedirect(e, "/login");
  }

  return getProfileWithDevices(session.data.userId);
});
