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

  const userExists = !!(await db.user.count({
    where: { username },
  }));

  if (userExists) {
    setResponseStatus(e, 409);
    return send(e, "A user with this username already exists");
  }

  const hash = await bcrypt.hash(password, 12);

  const user = await db.user.create({
    data: { username, password: hash },
  });

  const sessionData = { userId: user.id, username: user.username };

  const token = jwt.sign(sessionData, secret, {
    algorithm: "HS512",
    expiresIn: getExpiration().expirationTime,
  });

  const session = await getSession(e);

  await session.update(sessionData);
  return { token, userId: user.id, username };
});
