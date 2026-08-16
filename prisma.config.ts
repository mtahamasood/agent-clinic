import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "npx tsx prisma/seed.ts",
  },
  datasource: {
    // The only difference between the self-hosted and Vercel targets. A local
    // file here, a Turso URL there. No branch on deploy target anywhere in the
    // app — see specs/tech-stack.md, "Parity rules".
    url: env("DATABASE_URL"),
  },
});
