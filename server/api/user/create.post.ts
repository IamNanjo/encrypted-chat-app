import { PrismaClient } from "@prisma/client";
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

	const prisma = new PrismaClient();

	const userExists = !!(await prisma.user.count({
		where: { username }
	}));

	if (userExists) {
		setResponseStatus(e, 409);
		return await send(e, "A user with this username already exists");
	}

	const hash = await bcrypt.hash(password, 12);

	const user = await prisma.user.create({
		data: { username, password: hash }
	});

	e.context.session.userId = user.id;
	e.context.session.username = user.username;
	return await send(e);
});
