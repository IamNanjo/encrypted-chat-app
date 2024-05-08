import bcrypt from "bcrypt";
import z from "zod";
import db, { User, eq } from "~/server/db";
import { getSession, signJWT } from "~/server/session";

export default defineEventHandler(async (e) => {
  const { username, password } = await readValidatedBody(
    e,
    z.object({ username: z.string().min(1), password: z.string().min(1) }).parse
  );

  const user = db.select().from(User).where(eq(User.username, username)).get();

  if (!user) {
    const hash = await bcrypt.hash(password, 12);

    const userId = (await db.insert(User).values({ username, password: hash }))
      .lastInsertRowid as number;

    const sessionData = { userId, username };

    const token = signJWT(sessionData);
    const session = await getSession(e);

    await session.update(sessionData);
    return { ...sessionData, token };
  }

  if (!(await bcrypt.compare(password, user.password))) {
    return setResponseStatus(e, 401, "Incorrect password");
  }

  const sessionData = { userId: user.id, username };

  const token = signJWT(sessionData);
  const session = await getSession(e);

  await session.update(sessionData);
  return { ...sessionData, token };
});
