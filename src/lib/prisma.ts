import { PrismaClient } from "@/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import path from "node:path";
import fs from "node:fs";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Resolve the database connection.
 *
 * Order of precedence:
 *   1. TURSO_DATABASE_URL + TURSO_AUTH_TOKEN  → Turso cloud
 *   2. DATABASE_URL=file:./data/prod.db  → local SQLite file (self-hosted)
 *
 * The same `@prisma/adapter-libsql` works for both — Turso speaks libSQL over
 * HTTPS, and local SQLite is libSQL's native format. This lets us migrate
 * between the two with no code changes, just env vars.
 */
function resolveDbConfig(): { url: string; authToken?: string } {
  // Prefer Turso when configured, even if DATABASE_URL is set (e.g. because a
  // committed `.env` file exists in the repo).
  if (process.env.TURSO_DATABASE_URL) {
    return {
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    };
  }

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl?.startsWith("file:")) {
    // file:./data/prod.db → resolve to absolute path; ensure parent dir exists
    const rel = dbUrl.slice("file:".length);
    const abs = path.isAbsolute(rel) ? rel : path.resolve(process.cwd(), rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    return { url: `file:${abs}` };
  }

  throw new Error(
    "No database configured. Set TURSO_DATABASE_URL + TURSO_AUTH_TOKEN (cloud) " +
    "or DATABASE_URL=file:./data/prod.db (self-hosted)."
  );
}

function createPrismaClient() {
  const config = resolveDbConfig();
  const adapter = new PrismaLibSql(config);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// Reuse the client within a warm serverless isolate (Vercel, etc.).
globalForPrisma.prisma = prisma;
