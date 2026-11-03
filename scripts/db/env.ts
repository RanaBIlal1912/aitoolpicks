// Shared by the database command line tools: load .env.local if there is one, then validate the database variables.
// Run with Node 22.18+ (type stripping): `node scripts/db/health.ts`.
import { EnvError, parseEnv, redactEnv } from "../../src/server/env.ts";

export function loadLocalEnv(): void {
  for (const file of [".env.local", ".env"]) {
    try {
      process.loadEnvFile(file);
    } catch {
      /* the file does not exist: fine, the variables may come from the shell */
    }
  }
}

export function databaseEnvOrExit() {
  loadLocalEnv();
  try {
    const env = parseEnv(["database"], process.env as Record<string, string | undefined>);
    return { ...env, url: env.DATABASE_DIRECT_URL ?? env.DATABASE_URL };
  } catch (e) {
    if (e instanceof EnvError) {
      console.error("The database settings are not usable:");
      for (const p of e.problems) console.error(`  - ${p.name} ${p.reason}`);
      console.error("Set them in .env.local (see .env.example). Values are never printed.");
      console.error("What is currently set:", JSON.stringify(redactEnv(process.env as Record<string, string | undefined>).DATABASE_URL ?? "(nothing)"));
      process.exit(2);
    }
    throw e;
  }
}

export function hostOf(url: string): string {
  return new URL(url).hostname;
}

export function isLocal(url: string): boolean {
  return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostOf(url));
}
