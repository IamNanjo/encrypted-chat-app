import { prisma } from "~/server/db";
import bcrypt from "bcrypt";

export default defineEventHandler(async (e) => {
	const body = (await readBody(e)) as { username?: string; password?: string };

	// Will not happen in normal use as the fields are required
	if (
		!body ||
		!("username" in body) ||
		!("password" in body) ||
		!body.username ||
		!body.password
	) {
		setResponseStatus(e, 400);
		return await send(e, "Username or password missing from request body");
	}

	const username = body.username.toString();
	const password = body.password.toString();

	const user = await prisma.user.findUnique({ where: { username } });

	if (!user) {
		setResponseStatus(e, 404);
		return await send(e, "User not found");
	}

	if (!(await bcrypt.compare(password, user.password))) {
		setResponseStatus(e, 401);
		return await send(e, "Incorrect password");
	}

	e.context.session.userId = user.id;
	e.context.session.username = user.username;
	return await send(e);
});
