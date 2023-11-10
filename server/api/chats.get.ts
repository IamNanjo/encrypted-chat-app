import { PrismaClient } from "@prisma/client";

export default defineEventHandler(async (e) => {
	return [{ id: "abcdef", name: "Chat 1" }];
});
