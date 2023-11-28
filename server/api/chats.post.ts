import { prisma } from "~/server/db";

export default defineEventHandler(async (e) => {
	if (!("userId" in e.context.session)) {
		return await sendRedirect(e, "/login");
	}

	const body = (await readBody(e)) as { user?: string } | null;

	if (
		!body ||
		typeof body !== "object" ||
		!("user" in body) ||
		!body.user ||
		!body.user.toString()
	) {
		setResponseStatus(e, 400);
		return send(e, "No user selected");
	}

	if (body.user === e.context.session.userId) {
		setResponseStatus(e, 400);
		return send(e, "You cannot start a chat with yourself");
	}

	const alreadyExists = await prisma.chat.findFirst({
		where: {
			members: {
				every: {
					id: { in: [e.context.session.userId, body.user] }
				}
			}
		}
	});

	if (alreadyExists) {
		setResponseStatus(e, 409);
		return send(e, "Chat already exists");
	}

	const chat = await prisma.chat.create({
		data: {
			members: {
				connect: [{ id: e.context.session.userId }, { id: body.user }]
			}
		},
		include: {
			members: {
				select: {
					id: true
				}
			}
		}
	});

	setResponseStatus(e, 201);
	return chat;
});
