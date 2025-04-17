import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";
import * as schema from "~/db/schema";

import { dbUrl } from "~/server/env.mjs";

const client = createClient({ url: dbUrl, offline: true });
const db = drizzle(client, { schema: schema });

db.run(sql`
PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA auto_vacuum = FULL;
`);

export default db;
export * from "drizzle-orm";
export * from "~/db/schema";
