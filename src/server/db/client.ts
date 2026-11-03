// Database client. No "server-only" import here so scripts and tests can use it; the Next.js entry (server.ts) adds that guard.
//
// Settings follow Supabase's guidance for serverless functions: one connection per function instance, prepared statements off (the transaction
// pooler does not support them), TLS required for hosted databases, short timeouts.
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.ts";

export type Sql = ReturnType<typeof postgres>;
export type Db = ReturnType<typeof createDb>;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/** TLS is off only for a local database, unless DATABASE_SSL says otherwise. */
export function sslFor(url: string, override?: "require" | "disable"): false | "require" {
  if (override === "require") return "require";
  if (override === "disable") return false;
  try {
    return LOCAL_HOSTS.has(new URL(url).hostname) ? false : "require";
  } catch {
    return "require";
  }
}

export function createSql(url: string, options: { ssl?: "require" | "disable"; max?: number; applicationName?: string } = {}): Sql {
  return postgres(url, {
    max: options.max ?? 1,
    prepare: false,
    ssl: sslFor(url, options.ssl),
    idle_timeout: 20,
    connect_timeout: 10,
    max_lifetime: 60 * 30,
    onnotice: () => {},
    connection: { application_name: options.applicationName ?? "aitoolpicks" },
  });
}

export function createDb(sql: Sql) {
  return drizzle(sql, { schema });
}

export { schema };
