import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { randomBytes } from "node:crypto";

// Prefer .env.local (dev) then .env (fallback)
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// Resolve DB config the same way push-schema does — local SQLite via
// DATABASE_URL=file:..., or Turso via TURSO_DATABASE_URL+TURSO_AUTH_TOKEN.
function resolveDbConfig(): { url: string; authToken?: string } {
  // Prefer Turso if configured, even when DATABASE_URL is present.
  if (process.env.TURSO_DATABASE_URL) {
    if (!process.env.TURSO_AUTH_TOKEN) {
      throw new Error("TURSO_DATABASE_URL is set but TURSO_AUTH_TOKEN is missing.");
    }
    return {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    };
  }
  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl?.startsWith("file:")) {
    const rel = dbUrl.slice("file:".length);
    const abs = path.isAbsolute(rel) ? rel : path.resolve(process.cwd(), rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    return { url: `file:${abs}` };
  }
  throw new Error(
    "No database configured. Set DATABASE_URL=file:./data/prod.db or TURSO_DATABASE_URL+TURSO_AUTH_TOKEN."
  );
}

const config = resolveDbConfig();
const adapter = new PrismaLibSql({ url: config.url, authToken: config.authToken });
const prisma = new PrismaClient({ adapter });

async function main() {
  const username = (process.env.SEED_ADMIN_USERNAME || "admin").trim();

  // Read password from env, or generate a strong random one and print it.
  // The password MUST come from outside the repo — never commit credentials.
  let password = process.env.SEED_ADMIN_PASSWORD;
  let generated = false;
  if (!password) {
    // 24 bytes base64 ≈ 32 chars, plenty of entropy
    password = randomBytes(18).toString("base64").replace(/[+/=]/g, "").slice(0, 20);
    generated = true;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // Use raw SQL here instead of Prisma model ops: with the libSQL adapter,
  // model-based queries can intermittently time out on some environments,
  // while raw SQL works reliably (same approach as push-schema).
  const existingRows = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
    `SELECT id FROM "User" WHERE username = ? LIMIT 1`,
    username,
  );

  if (existingRows.length === 0) {
    await prisma.$executeRawUnsafe(
      `INSERT INTO "User" ("username", "password", "role") VALUES (?, ?, ?)`,
      username,
      hashedPassword,
      "superadmin",
    );
    console.log(`Superadmin created: ${username}`);
  } else {
    await prisma.$executeRawUnsafe(
      `UPDATE "User" SET "password" = ?, "role" = ? WHERE "username" = ?`,
      hashedPassword,
      "superadmin",
      username,
    );
    console.log(`Superadmin password updated: ${username}`);
  }

  if (generated) {
    console.log("");
    console.log("=".repeat(60));
    console.log("Generated password (save this now — won't be shown again):");
    console.log(`  ${password}`);
    console.log("=".repeat(60));
    console.log("");
    console.log("To set your own next time, run:");
    console.log(`  SEED_ADMIN_PASSWORD='your-strong-password' npm run db:seed`);
  }
}

main()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
