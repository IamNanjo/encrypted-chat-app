import bcrypt from "bcrypt";
import z from "zod";
import db, { User, like } from "~/server/db";
import { getSession } from "~/server/session";

export default defineEventHandler(async (e) => {
    const { username, password } = await readValidatedBody(
        e,
        z.object({ username: z.string().min(1), password: z.string().min(1) })
            .parse,
    );

    const user = await db
        .select({
            id: User.id,
            username: User.username,
            password: User.password,
        })
        .from(User)
        .where(like(User.username, username))
        .get();

    if (!user) {
        const hash = await bcrypt.hash(password, 12);

        const user = await db
            .insert(User)
            .values({ username, password: hash })
            .returning({ userId: User.id, username: User.username })
            .get();

        const session = await getSession(e);

        await session.update(user);
        return { ...user };
    }

    if (!(await bcrypt.compare(password, user.password))) {
        return setResponseStatus(e, 401, "Incorrect password");
    }

    const sessionData = { userId: user.id, username: user.username };

    const session = await getSession(e);

    await session.update(sessionData);
    return { ...sessionData };
});
