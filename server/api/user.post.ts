import bcrypt from "bcrypt";
import z from "zod";
import db, { User, sql, eq } from "~/server/db";
import { getSession, signJWT } from "~/server/session";

export default defineEventHandler(async (e) => {
  const { username, password } = await readValidatedBody(
    e,
    z.object({ username: z.string().min(1), password: z.string().min(1) }).parse
  );

  const userExists = !!db
    .select({ count: sql`count(id)` })
    .from(User)
    .where(eq(User.username, username))
    .get()?.count;

  if (userExists) {
    setResponseStatus(e, 409);
    return "A user with this username already exists";
  }

  const hash = await bcrypt.hash(password, 12);

  const userId = (await db.insert(User).values({ username, password: hash }))
    .lastInsertRowid as number;

  const sessionData = { userId, username };

  const token = signJWT(sessionData);

  await (await getSession(e)).update(sessionData);
  return { ...sessionData, token };
});
