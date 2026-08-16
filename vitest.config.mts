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
    include: ["src/**/*.test.ts", "prisma/**/*.test.ts"],
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
});
