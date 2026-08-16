import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/generated/prisma/client";

/**
 * The clinic's database client.
 *
 * There is deliberately no branch on deploy target here. `DATABASE_URL` is a
 * local file when self-hosted and a Turso URL on Vercel, and that difference is
 * the whole difference — see specs/tech-stack.md, "Parity rules".
 */
function createPrismaClient() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env, then run `npm run migrate`.",
    );
  }

  const adapter = new PrismaLibSql({
    url,
    // Only a hosted Turso database authenticates. The local file ignores it.
    authToken: process.env.DATABASE_AUTH_TOKEN,
  });

  return new PrismaClient({ adapter });
}

// Cached on globalThis so Next's dev-server hot reload reuses one connection
// instead of opening a new one on every edit. Harmless in production, where the
// module is evaluated once — and cheaper than branching on NODE_ENV.
const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof createPrismaClient>;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

globalForPrisma.prisma = prisma;
