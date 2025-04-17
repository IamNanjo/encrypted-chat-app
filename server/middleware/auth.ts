import { getSession, type SessionData } from "~/server/session";
import type { useSession } from "h3";

declare module "h3" {
    interface H3EventContext {
        session: Awaited<ReturnType<typeof useSession<SessionData>>> | null;
    }
}

export default defineEventHandler(async (e) => {
    if (e.path === "/login") return;
    const session = await getSession(e);
    e.context.session = Object.keys(session.data).length ? session : null;
});
