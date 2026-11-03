// Drizzle Kit configuration. `drizzle-kit generate` needs no database; `migrate` and `push` use DATABASE_DIRECT_URL (the session pooler or the
// direct connection on Supabase), falling back to DATABASE_URL. The URL is read from the environment and never written to a file.
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/server/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL || "postgres://invalid.invalid/none" },
  strict: true,
  verbose: true,
  migrations: { table: "__drizzle_migrations", schema: "drizzle" },
});
