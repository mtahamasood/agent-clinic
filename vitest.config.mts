import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    // Unit tests read the same DATABASE_URL as the app; Next loads .env on its
    // own, Vitest does not.
    setupFiles: ["dotenv/config"],
    // The suite migrates and seeds its own database (D11), so `npm test` needs
    // no preceding command and leaves the developer's clinic.db alone.
    globalSetup: ["./vitest.globalSetup.ts"],
    env: {
      DATABASE_URL: "file:./clinic.test.db",
    },
    // Seed data lives in prisma/, so its consistency test does too. Without
    // this pattern that file is never collected — a test that cannot fail
    // reads as coverage and provides none.
    // `.tsx` is here for the roster card's test (Phase 2): the card's
    // undiagnosed branch is unreachable from a seeded demo, so it is rendered
    // with react-dom/server rather than eyeballed. Same lesson as the pattern
    // above — a test the runner never collects reads as coverage and is none.
    include: ["src/**/*.test.ts", "src/**/*.test.tsx", "prisma/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
