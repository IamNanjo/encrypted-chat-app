import type { Config } from "drizzle-kit";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("No database URL defined");

export default {
  driver: "better-sqlite",
  out: "./db/out/migrations",
  schema: "./db/schema.ts",
  dbCredentials: { url },
  verbose: true,
  strict: true,
} satisfies Config;
