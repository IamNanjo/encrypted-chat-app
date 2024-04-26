import db from "~/server/db";
import getSession from "~/server/session";
import bcrypt from "bcrypt";

export default defineEventHandler(async (e) => {
 const session = await getSession(e);

 if (!("userId" in session.data)) {
   return sendRedirect(e, "/login");
 }

  const body = (await readBody(e)) as {
    username?: string;
    currentPassword?: string;
    newPassword?: string;
  };

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    setResponseStatus(e, 400);
    return "Wrong request body format";
  }

  if (!("username" in body)) {
    setResponseStatus(e, 400);
    return "Username cannot be empty";
  }

  const userExists = await db.user.count({
    where: { username: body.username },
  });

  if (userExists) {
    setResponseStatus(e, 409);
    return "A user with that username already exists";
  }

  if (!body.currentPassword) {
    setResponseStatus(e, 400);
    return "Wrong current password";
  }

  const user = await db.user.findUnique({
    where: { id: session.data.userId },
  });

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
    return db.user.update({
      where: { id: session.data.userId },
      data: { username: body.username },
    });
  }

  const newHash = await bcrypt.hash(body.newPassword, 12);

  const profile = await db.user.update({
    where: { id: session.data.userId },
    data: {
      username: body.username,
      password: newHash,
    },
    select: {
      id: true,
      username: true,
      created: true,
      devices: {
        select: {
          id: true,
          name: true,
          lastUsed: true,
        },
      },
    },
  });

  return profile;
});
