import { getSession } from "~/server/session";

export default defineEventHandler(async (e) => {
  const session = await getSession(e);
  await session.clear();
  await sendRedirect(e, "/login");
});
