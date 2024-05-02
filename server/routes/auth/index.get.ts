import { getSession } from "~/server/session";

export default defineEventHandler(async (e) => {
  const data = (await getSession(e)).data;

  return Object.keys(data).length ? data : null;
});
