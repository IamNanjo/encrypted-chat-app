import db from "~/server/db";
import getSession from "~/server/session";

export default defineEventHandler(async (e) => {
 const session = await getSession(e);

 if (!("userId" in session.data)) {
   return sendRedirect(e, "/login");
 }

  await db.user.delete({ where: { id: session.data.userId } });

  e.context.session = null;

  setResponseStatus(e, 204);
  return send(e, "User deleted");
});
