import type { Config } from "drizzle-kit";

const dbUrl = process.env.CHAT_DB_URL;
if (!dbUrl) throw new Error("No database path defined");

export default {
    dialect: "sqlite",
    out: "./db/migrations",
    schema: "./db/schema.ts",
    dbCredentials: { url: dbUrl },
    verbose: true,
    strict: true,
} satisfies Config;
