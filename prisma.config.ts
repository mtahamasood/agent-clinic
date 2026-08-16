import "dotenv/config";
import { defineConfig } from "prisma/config";

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
    //
    // Read with process.env rather than Prisma's env() helper, which throws on
    // a missing variable. `postinstall` runs `prisma generate` before the user
    // has copied .env.example, and generate needs only the schema — so a hard
    // failure there would break `npm install` on a clean clone.
    url: process.env["DATABASE_URL"],
  },
});
