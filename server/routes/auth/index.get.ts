import db, { User, eq } from "~/server/db";

export default defineEventHandler(async (e) => {
  const session = e.context.session;
  if (!session) return null;
  const { data, clear } = session;

  const user = db.select().from(User).where(eq(User.id, data.userId)).get();

  if (!user) {
    await clear();
    return null;
  }

  return Object.keys(data).length ? data : null;
});
