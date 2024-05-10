import bcrypt from "bcrypt";
import z from "zod";
import db, { User, like } from "~/server/db";
import { getSession, signJWT } from "~/server/session";

export default defineEventHandler(async (e) => {
  const { username, password } = await readValidatedBody(
    e,
    z.object({ username: z.string().min(1), password: z.string().min(1) }).parse
  );

  const user = db
    .select({ id: User.id, username: User.username, password: User.password })
    .from(User)
    .where(like(User.username, username))
    .get();

  if (!user) {
    const hash = await bcrypt.hash(password, 12);

    const user = db
      .insert(User)
      .values({ username, password: hash })
      .returning({ userId: User.id, username: User.username })
      .get();

    const token = signJWT(user);
    const session = await getSession(e);

    await session.update(user);
    return { ...user, token };
  }

  if (!(await bcrypt.compare(password, user.password))) {
    return setResponseStatus(e, 401, "Incorrect password");
  }

  const sessionData = { userId: user.id, username: user.username };

  const token = signJWT(sessionData);
  const session = await getSession(e);

  await session.update(sessionData);
  return { ...sessionData, token };
});
