import { prisma } from "~/server/db";

export default defineEventHandler((e) => {
  if (!("userId" in e.context.session)) {
    return sendRedirect(e, "/login");
  }

  const query = getQuery(e) as { q?: string };

  return prisma.user.findMany({
    where: {
      id: { not: e.context.session.userId },
      username: { contains: query.q || "" },
    },
    select: { id: true, username: true },
  });
});
