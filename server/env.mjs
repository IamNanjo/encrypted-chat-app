import crypto from "node:crypto";
import { accessSync, constants } from "node:fs";

// Default to random 64 character secret
let sessionSecret = process.env.CHAT_SECRET ?? "";

if (sessionSecret === "") {
    console.warn(
        "CHAT_SECRET not set. Using randomly generated session secret",
    );
    sessionSecret = crypto.randomBytes(48).toString("base64url");
}

const dbUrl = process.env.CHAT_DB_URL ?? "";

if (!sessionSecret || sessionSecret.length < 32) {
    console.error("CHAT_SECRET must be at least 32 characters long");
    process.exit(1);
}

if (dbUrl === "") {
    console.error("CHAT_DB_URL does not exist");
    process.exit(1);
}

try {
    accessSync(dbUrl.replace("file:", ""), constants.R_OK | constants.W_OK);
} catch {
    console.error(
        `CHAT_DB_URL does not point to a readable and writable database file`,
    );
    process.exit(1);
}

export { sessionSecret, dbUrl };
