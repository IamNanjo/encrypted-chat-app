import z from "zod";
import bcrypt from "bcrypt";
import db, { User, sql, eq } from "~/server/db";
import { getSession } from "~/server/session";
import { getProfileWithDevices } from "~/server/api/profile.get";

export default defineEventHandler(async (e) => {
  const session = e.context.session;
  if (!session) return sendRedirect(e, "/login");

  const body = await readValidatedBody(
    e,
    z.object({
      username: z.string({ message: "Username cannot be empty" }).min(1),
      currentPassword: z
        .string({ message: "Current password cannot be empty" })
        .min(1),
      newPassword: z.string(),
    }).parse
  );

  const userExists = !!db
    .select({ count: sql`count(id)` })
    .from(User)
    .where(eq(User.username, body.username))
    .get()?.count;

  if (userExists) {
    setResponseStatus(e, 409);
    return "A user with that username already exists";
  }

  if (!body.currentPassword) {
    setResponseStatus(e, 400);
    return "Wrong current password";
  }

  const isCurrentUser = eq(User.id, session.data.userId);

  const user = db.select().from(User).where(isCurrentUser).get();

  if (!user) {
    e.context.session = null;
    return sendRedirect(e, "/login");
  }

  const passwordMatches = await bcrypt.compare(
    body.currentPassword,
    user.password
  );

  if (!passwordMatches) {
    setResponseStatus(e, 401);
    return "Wrong current password";
  }

  if (!body.newPassword) {
    return db
      .update(User)
      .set({ username: body.username })
      .where(isCurrentUser)
      .returning()
      .get();
  }

  const newHash = await bcrypt.hash(body.newPassword, 12);

  db.update(User).set({ username: body.username, password: newHash }).run();

  return getProfileWithDevices(session.data.userId);
});
