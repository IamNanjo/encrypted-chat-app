import z from "zod";
import db, {
  Message,
  User,
  ChatToUser,
  and,
  eq,
  exists,
  asc,
} from "~/server/db";
import { getSession } from "~/server/session";

export default defineEventHandler(async (e) => {
  const session = e.context.session;
  if (!session) return sendRedirect(e, "/login");

  const query = await getValidatedQuery(
    e,
    z.object({
      chatId: z.coerce.number().int(),
      deviceId: z.coerce.number().int(),
    }).parse
  );

  const chatId = query.chatId;
  const deviceId = query.deviceId;

  return db
    .select({
      id: Message.id,
      messageId: Message.messageId,
      content: Message.content,
      created: Message.created,
      sender: {
        id: User.id,
        username: User.username,
      },
    })
    .from(Message)
    .where(
      and(
        eq(Message.chatId, chatId),
        eq(Message.deviceId, deviceId),
        exists(
          db
            .select()
            .from(ChatToUser)
            .where(
              and(
                eq(ChatToUser.chatId, query.chatId),
                eq(ChatToUser.userId, session.data.userId)
              )
            )
        )
      )
    )
    .innerJoin(User, eq(Message.userId, User.id))
    .orderBy(asc(Message.created))
    .all();
});
