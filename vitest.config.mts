import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, "src") } },
  // globalSetup starts a disposable PostgreSQL for the database tests (skipped when none is installed or SKIP_DB_TESTS=1).
  test: { environment: "node", include: ["tests/**/*.test.ts"], globalSetup: ["tests/global-setup.ts"], testTimeout: 30000, hookTimeout: 60000 },
});
