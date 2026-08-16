import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright runs against a production build, not `next dev` — decision D3 in
 * specs/2026-08-16-walking-skeleton/requirements.md. Dev-server rendering is the
 * easy case; the production path is where Prisma adapters, server-component
 * bundling, and environment loading actually misbehave, and it is what Phase 6
 * and Phase 8 stake their exit criteria on.
 */
export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "html" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npm start",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    // A cold production build is not fast. Give it room on a loaded CI runner.
    timeout: 180_000,
  },
});
