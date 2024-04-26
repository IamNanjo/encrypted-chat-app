import crypto from "node:crypto";

import type { H3Event, EventHandlerRequest } from "h3";

const secret = crypto.randomBytes(48).toString("base64url");

export default async function (e: H3Event<EventHandlerRequest>) {
  const expirationDate = new Date();
  const now = Date.now();
  const expirationTime = 30 * 60;
  expirationDate.setTime(now + expirationTime * 1000);

  return await useSession(e, {
    password: secret,
    maxAge: expirationTime,
    cookie: {
      sameSite: "strict",
      httpOnly: true,
      secure: true,
      maxAge: expirationTime,
      expires: expirationDate,
    },
  });
}
