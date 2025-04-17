import z from "zod";
import db, {
    Chat,
    ChatToUser,
    Device,
    Message,
    User,
    and,
    eq,
    exists,
    isNotNull,
} from "~/server/db";

export default defineEventHandler(async (e) => {
    const session = e.context.session;
    if (!session) return sendRedirect(e, "/login");

    const body = await readValidatedBody(
        e,
        z.object({
            chatId: z.number({ message: "No chat ID provided" }),
            deviceId: z.number({ message: "No device ID provided" }),
            messageId: z
                .string({ message: "No message ID provided" })
                .length(36),
            message: z.string({ message: "No message provided" }),
        }).parse,
    );

    const chat = await db
        .select()
        .from(Chat)
        .where(
            and(
                eq(Chat.id, body.chatId),
                exists(
                    db
                        .select()
                        .from(ChatToUser)
                        .where(
                            and(
                                eq(ChatToUser.chatId, body.chatId),
                                eq(ChatToUser.userId, session.data.userId),
                            ),
                        ),
                ),
            ),
        )
        .get();

    if (!chat) {
        setResponseStatus(e, 404);
        return send(e, "Chat not found");
    }

    const messageId = (
        await db
            .insert(Message)
            .values({
                userId: session.data.userId,
                chatId: body.chatId,
                deviceId: body.deviceId,
                messageId: body.messageId,
                content: body.message,
            })
            .run()
    ).lastInsertRowid;

    const message = await db
        .select({
            id: Message.id,
            chatId: Message.chatId,
            deviceId: Message.deviceId,
            messageId: Message.messageId,
            content: Message.content,
            created: Message.created,
            sender: {
                id: User.id,
                username: User.username,
            },
        })
        .from(Message)
        .innerJoin(User, eq(Message.userId, User.id))
        .where(eq(Message.id, Number(messageId)))
        .get();

    if (!message) return setResponseStatus(e, 500, "Message creation failed");

    const recipient = await db
        .select({ id: User.id })
        .from(Device)
        .leftJoin(User, eq(Device.userId, User.id))
        .where(and(eq(Device.id, message.deviceId), isNotNull(User.id)))
        .get();

    if (!recipient || !recipient.id)
        return setResponseStatus(e, 400, "Recipient not found");

    if (!global.clients) global.clients = {};

    if (recipient.id in global.clients && global.clients[recipient.id]) {
        for (const socket of Object.values(global.clients[recipient.id])) {
            if (socket.readyState !== socket.OPEN) continue;

            socket.send!(
                JSON.stringify({
                    event: "message",
                    mode: "post",
                    data: message,
                } as SocketMessage<typeof message>),
            );
        }
    }

    setResponseStatus(e, 201);
    return message;
});
