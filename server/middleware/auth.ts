import { getSession, type SessionData } from "~/server/session";
import type { useSession } from "h3";

declare module "h3" {
  interface H3EventContext {
    session: Awaited<ReturnType<typeof useSession<SessionData>>> | null;
  }
}

defineRequestMiddleware;

export default defineEventHandler(async (e) => {
  const authPage = "/login";
  console.log(e.path);
  if (e.path === authPage) return;

  const session = await getSession(e);
  e.context.session = Object.keys(session.data).length ? session : null;
});
