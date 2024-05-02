import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import z from "zod";
import db from "~/server/db";
import { secret, getExpiration, getSession } from "~/server/session";

export default defineEventHandler(async (e) => {
  const { username, password } = await readValidatedBody(
    e,
    z.object({ username: z.string().min(1), password: z.string().min(1) }).parse
  );

  const user = await db.user.findUnique({ where: { username } });

  if (!user) {
    setResponseStatus(e, 404);
    return send(e, "User not found");
  }

  if (!(await bcrypt.compare(password, user.password))) {
    setResponseStatus(e, 401);
    return send(e, "Incorrect password");
  }

  const sessionData = { userId: user.id, username: user.username };

  const token = jwt.sign(sessionData, secret, {
    algorithm: "HS512",
    expiresIn: getExpiration().expirationTime,
  });

  const session = await getSession(e);

  await session.update(sessionData);
  return { token, userId: user.id, username };
});
