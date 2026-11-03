// Validated server environment. Nothing in here may be imported by browser code: every secret lives in a variable WITHOUT the NEXT_PUBLIC_ prefix.
//
// `parseEnv` is a pure function (easy to test). `getEnv` reads process.env once and throws a readable error that names the bad variables
// but never prints their values. Only the variables for the feature being used are required, so Phase 3 (database) can run without
// the auth, storage or deploy settings that later phases add.
import { z } from "zod";

const emptyToUndefined = (v: unknown) => (typeof v === "string" && v.trim() === "" ? undefined : v);
const optional = <T extends z.ZodTypeAny>(schema: T) => z.preprocess(emptyToUndefined, schema.optional());

const bool = z.preprocess((v) => {
  if (typeof v === "boolean") return v;
  if (typeof v !== "string") return v;
  const s = v.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(s)) return true;
  if (["0", "false", "no", "off", ""].includes(s)) return false;
  return v; // not recognised: let the schema reject it instead of guessing
}, z.boolean());

/** A PostgreSQL connection string. Both postgres:// and postgresql:// are accepted; it must name a host and a database. */
const postgresUrl = z
  .string()
  .min(1, "is required")
  .refine((v) => {
    try {
      const u = new URL(v);
      return (u.protocol === "postgres:" || u.protocol === "postgresql:") && u.hostname.length > 0 && u.pathname.length > 1;
    } catch {
      return false;
    }
  }, "must be a postgres:// or postgresql:// URL with a host and a database name");

const httpsUrl = z.string().refine((v) => {
  try {
    return new URL(v).protocol === "https:";
  } catch {
    return false;
  }
}, "must be an https:// URL");

/** Database access (Phase 3). */
export const databaseEnvSchema = z.object({
  /** Runtime queries. On Supabase this is the transaction pooler (port 6543); prepared statements are switched off by the client. */
  DATABASE_URL: postgresUrl,
  /** Migrations, import and backups. On Supabase this is the session pooler or the direct connection (port 5432). Falls back to DATABASE_URL. */
  DATABASE_DIRECT_URL: optional(postgresUrl),
  /** "require" for hosted databases, "disable" for a local one. Default: decided from the host name. */
  DATABASE_SSL: optional(z.enum(["require", "disable"])),
});

/** Authentication and storage (Phase 5 onward). Defined now so the names and rules are fixed. */
export const authEnvSchema = z.object({
  SUPABASE_URL: httpsUrl,
  SUPABASE_ANON_KEY: z.string().min(20, "looks too short to be a key"),
  /** Server only. Bypasses every access rule, so it is never exposed to the browser and never logged. */
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20, "looks too short to be a key"),
});

/** Site and runtime switches (Phase 8). All have safe defaults. */
export const runtimeEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SITE_URL: optional(httpsUrl),
  /** Which data the build reads. "json" keeps today's behaviour and is the rollback path. */
  CONTENT_SOURCE: z.enum(["json", "db"]).default("json"),
  /** Vercel deploy hook called after publishing. Optional until the hosting phase. */
  DEPLOY_HOOK_URL: optional(httpsUrl),
  /** Analytics stay off unless this is explicitly true. */
  ANALYTICS_ENABLED: bool.default(false),
  ANALYTICS_SALT: optional(z.string().min(16, "must be at least 16 characters")),
  CRON_SECRET: optional(z.string().min(16, "must be at least 16 characters")),
  HEALTH_SECRET: optional(z.string().min(16, "must be at least 16 characters")),
  SENTRY_DSN: optional(httpsUrl),
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;
export type AuthEnv = z.infer<typeof authEnvSchema>;
export type RuntimeEnv = z.infer<typeof runtimeEnvSchema>;

export const ENV_GROUPS = { database: databaseEnvSchema, auth: authEnvSchema, runtime: runtimeEnvSchema } as const;
export type EnvGroup = keyof typeof ENV_GROUPS;
type GroupOutput<G extends EnvGroup> = z.infer<(typeof ENV_GROUPS)[G]>;
type Merge<T extends readonly EnvGroup[]> = { [K in T[number]]: GroupOutput<K> }[T[number]] extends infer U ? (U extends unknown ? (x: U) => void : never) extends (x: infer I) => void ? I : never : never;

export class EnvError extends Error {
  /** Variable names and reasons only, never values. */
  readonly problems: { name: string; reason: string }[];
  constructor(problems: { name: string; reason: string }[]) {
    super(`Invalid environment: ${problems.map((p) => `${p.name} ${p.reason}`).join("; ")}`);
    this.name = "EnvError";
    this.problems = problems;
  }
}

/** Validate the listed groups against `source`. Throws EnvError listing every problem at once. Values are never included in messages. */
export function parseEnv<const T extends readonly EnvGroup[]>(groups: T, source: Record<string, string | undefined>): Merge<T> {
  const problems: { name: string; reason: string }[] = [];
  const out: Record<string, unknown> = {};
  for (const g of groups) {
    const schema = ENV_GROUPS[g];
    const result = schema.safeParse(source);
    if (result.success) Object.assign(out, result.data);
    else {
      for (const issue of result.error.issues) {
        const name = String(issue.path[0] ?? g);
        const missing = issue.code === "invalid_type" && source[name] === undefined;
        problems.push({ name, reason: missing ? "is required but not set" : issue.message });
      }
    }
  }
  if (problems.length) throw new EnvError(problems);
  return out as Merge<T>;
}

let cached: unknown;
/** Read and validate process.env once. */
export function getEnv<const T extends readonly EnvGroup[]>(groups: T): Merge<T> {
  const key = [...groups].sort().join(",");
  const store = (cached ??= {}) as Record<string, unknown>;
  return (store[key] ??= parseEnv(groups, process.env as Record<string, string | undefined>)) as Merge<T>;
}

/** Test helper: forget cached environments. */
export function resetEnvCache() {
  cached = undefined;
}

/** A copy of the values that is safe to print: secrets are replaced, connection strings lose their user and password. */
export function redactEnv(source: Record<string, string | undefined>): Record<string, string> {
  const secretName = /KEY|SECRET|SALT|TOKEN|PASSWORD|HOOK|DSN/i;
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(source)) {
    if (v === undefined || v === "") continue;
    if (/URL$/.test(k) && /^postgres/.test(v)) {
      try {
        const u = new URL(v);
        out[k] = `${u.protocol}//***@${u.host}${u.pathname}`;
      } catch {
        out[k] = "[unparseable]";
      }
    } else out[k] = secretName.test(k) ? "[set]" : v;
  }
  return out;
}

/** Names that must never carry a secret because Next.js would put them in the browser bundle. */
export const SERVER_ONLY_NAMES = ["DATABASE_URL", "DATABASE_DIRECT_URL", "SUPABASE_SERVICE_ROLE_KEY", "DEPLOY_HOOK_URL", "ANALYTICS_SALT", "CRON_SECRET", "HEALTH_SECRET"] as const;
