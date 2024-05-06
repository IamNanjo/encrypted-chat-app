import db, { User, eq } from "~/server/db";
import { getSession } from "~/server/session";

export default defineEventHandler(async (e) => {
  const { data, clear } = await getSession(e);

  const user = db.select().from(User).where(eq(User.id, data.userId)).get();

  if (!user) {
    await clear();
    return null;
  }

  return Object.keys(data).length ? data : null;
});
