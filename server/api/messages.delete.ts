import { PrismaClient } from "@prisma/client";

export default defineEventHandler(async (e) => {
	return await send(e);
});
