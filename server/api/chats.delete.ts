import z from "zod";
import db, { Chat, ChatToUser, eq } from "~/server/db";

export default defineEventHandler(async (e) => {
    const session = e.context.session;
    if (!session) return sendRedirect(e, "/login");

    const { id: chatId } = await readValidatedBody(
        e,
        z.object({
            id: z
                .number({ message: "No chat ID provided" })
                .int("Chat ID must be an integer"),
        }).parse,
    );

    const chats = await db
        .select({ id: Chat.id, userId: ChatToUser.userId })
        .from(Chat)
        .innerJoin(ChatToUser, eq(Chat.id, ChatToUser.chatId))
        .where(eq(Chat.id, chatId))
        .all();

    if (!chats.length) {
        setResponseStatus(e, 404, "Chat not found");
        return;
    }

    await db.delete(Chat).where(eq(Chat.id, chatId)).run();

    if (!global.clients) global.clients = {};
    for (const chat of chats) {
        if (!chat || !(chat.userId in global.clients)) continue;

        for (const socket of Object.values(global.clients[chat.userId])) {
            if (socket.readyState !== socket.OPEN) continue;

            socket.send!(
                JSON.stringify({
                    event: "chat",
                    mode: "delete",
                    data: chat,
                } as SocketMessage<typeof chat>),
            );
        }
    }

    return e;
});
