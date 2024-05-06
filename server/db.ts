import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import * as schema from "~/db/schema";

const dbURL = process.env.DATABASE_URL;
if (!dbURL) throw new Error("No database URL defined");

const db = drizzle(new Database(dbURL), { schema });

export default db;
export * from "drizzle-orm";
export * from "~/db/schema";
