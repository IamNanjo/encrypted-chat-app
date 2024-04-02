import { prisma } from "~/server/db";
import bcrypt from "bcrypt";

export default defineEventHandler(async (e) => {
  if (!("userId" in e.context.session)) {
    return await sendRedirect(e, "/login");
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

  const userExists = await prisma.user.count({
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

  const user = await prisma.user.findUnique({
    where: { id: e.context.session.userId },
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
    return prisma.user.update({
      where: { id: e.context.session.userId },
      data: { username: body.username },
    });
  }

  const newHash = await bcrypt.hash(body.newPassword, 12);

  const profile = await prisma.user.update({
    where: { id: e.context.session.userId },
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
