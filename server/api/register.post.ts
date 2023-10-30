import bcrypt from "bcrypt";

export default defineEventHandler(async (e) => {
	const body = (await readBody(e)) as { username?: string; password?: string };

	// Will not happen in normal use as the fields are required
	if (!body || !("username" in body) || !("password" in body)) {
		setResponseStatus(e, 400);
		return await send(e, "Username or password missing from request body");
	}

	const hash = await bcrypt.hash("", 12);

	e.context.session.userId = 0;
	return await sendRedirect(e, "/");
});
