import { prisma } from "~/server/db";

export default defineEventHandler(async (e) => {
  if (!("userId" in e.context.session)) {
    return sendRedirect(e, "/login");
  }

  await prisma.user.delete({ where: { id: e.context.session.userId } });

  e.context.session = null;

  setResponseStatus(e, 204);
  return send(e, "User deleted");
});
