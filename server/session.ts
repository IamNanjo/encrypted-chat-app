import { sessionSecret } from "~/server/env.mjs";

import type { SessionConfig } from "h3";

export interface SessionData {
    userId: number;
    username: string;
}

export const expirationTime = 7 * 24 * 60 * 60;

export function getSessionConfig(): SessionConfig {
    return {
        password: sessionSecret,
        maxAge: expirationTime,
        name: "auth",
        cookie: {
            sameSite: "strict",
            httpOnly: true,
            secure: true,
        },
    };
}

export function getSession(e: Parameters<typeof useSession>[0]) {
    return useSession<SessionData>(e, getSessionConfig());
}
