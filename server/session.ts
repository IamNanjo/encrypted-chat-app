import crypto from "node:crypto";
import jwt from "jsonwebtoken";

import type { H3Event, EventHandlerRequest, SessionConfig } from "h3";

interface SessionData {
  userId: number;
  username: string;
}

export const secret =
  process.env.CHAT_SESSION_SECRET ??
  crypto.randomBytes(48).toString("base64url");

export const expirationTime = 7 * 24 * 60 * 60;

export function getSessionConfig(): SessionConfig {
  return {
    password: secret,
    maxAge: expirationTime,
    name: "auth",
    cookie: {
      sameSite: "strict",
      httpOnly: true,
      secure: true,
    },
  };
}

export function signJWT(data: SessionData) {
  return jwt.sign(data, secret, {
    algorithm: "HS512",
    expiresIn: expirationTime,
  });
}

export function verifyJWT(token: string) {
  try {
    return jwt.verify(token, secret) as SessionData;
  } catch {
    return null;
  }
}

export async function getSession(e: H3Event<EventHandlerRequest>) {
  return await useSession<SessionData>(e, getSessionConfig());
}
