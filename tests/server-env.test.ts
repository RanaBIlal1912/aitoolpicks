import { describe, expect, it } from "vitest";
import { EnvError, getEnv, parseEnv, redactEnv, resetEnvCache, SERVER_ONLY_NAMES } from "../src/server/env.ts";

const DB = "postgres://app:s3cretpassw0rd@db.example.supabase.co:6543/postgres";

describe("environment validation", () => {
  it("accepts a valid database setting and applies defaults", () => {
    const env = parseEnv(["database", "runtime"], { DATABASE_URL: DB });
    expect(env.DATABASE_URL).toBe(DB);
    expect(env.DATABASE_DIRECT_URL).toBeUndefined();
    expect(env.CONTENT_SOURCE).toBe("json");
    expect(env.ANALYTICS_ENABLED).toBe(false);
    expect(env.NODE_ENV).toBe("development");
  });

  it("treats empty strings as not set", () => {
    const env = parseEnv(["database", "runtime"], { DATABASE_URL: DB, DATABASE_DIRECT_URL: "", DEPLOY_HOOK_URL: "  ", NEXT_PUBLIC_SITE_URL: "" });
    expect(env.DATABASE_DIRECT_URL).toBeUndefined();
    expect(env.DEPLOY_HOOK_URL).toBeUndefined();
    expect(env.NEXT_PUBLIC_SITE_URL).toBeUndefined();
  });

  it("reports every problem at once, by name, without printing any value", () => {
    let err: EnvError | undefined;
    try {
      parseEnv(["database", "runtime"], { DATABASE_URL: "mysql://root:topsecretvalue@host/db", CONTENT_SOURCE: "cloud", ANALYTICS_ENABLED: "maybe", HEALTH_SECRET: "short" });
    } catch (e) {
      err = e as EnvError;
    }
    expect(err).toBeInstanceOf(EnvError);
    const names = err!.problems.map((p) => p.name).sort();
    expect(names).toEqual(["ANALYTICS_ENABLED", "CONTENT_SOURCE", "DATABASE_URL", "HEALTH_SECRET"]);
    expect(err!.message).not.toContain("topsecretvalue");
    expect(err!.message).not.toContain("mysql://");
    expect(err!.message).not.toContain("short");
  });

  it("says plainly when a required variable is missing", () => {
    expect(() => parseEnv(["database"], {})).toThrow(/DATABASE_URL is required but not set/);
  });

  it("only accepts postgres connection strings with a host and a database", () => {
    for (const bad of ["", "postgres://", "postgres://host", "http://host/db", "not a url"]) expect(() => parseEnv(["database"], { DATABASE_URL: bad }), bad).toThrow(EnvError);
    for (const ok of ["postgres://u:p@h:5432/d", "postgresql://u@h/d?sslmode=require"]) expect(parseEnv(["database"], { DATABASE_URL: ok }).DATABASE_URL).toBe(ok);
  });

  it("parses booleans strictly and leaves analytics off unless clearly enabled", () => {
    for (const on of ["true", "TRUE", "1", "yes", "on"]) expect(parseEnv(["runtime"], { ANALYTICS_ENABLED: on }).ANALYTICS_ENABLED, on).toBe(true);
    for (const off of ["false", "0", "no", "off", ""]) expect(parseEnv(["runtime"], { ANALYTICS_ENABLED: off }).ANALYTICS_ENABLED, off).toBe(false);
    expect(() => parseEnv(["runtime"], { ANALYTICS_ENABLED: "enabled" })).toThrow(EnvError);
  });

  it("requires https for addresses a visitor or a third party will see", () => {
    expect(() => parseEnv(["runtime"], { NEXT_PUBLIC_SITE_URL: "http://example.com" })).toThrow(/https/);
    expect(() => parseEnv(["runtime"], { DEPLOY_HOOK_URL: "http://api.vercel.com/hook" })).toThrow(/https/);
    expect(parseEnv(["runtime"], { NEXT_PUBLIC_SITE_URL: "https://example.com" }).NEXT_PUBLIC_SITE_URL).toBe("https://example.com");
  });

  it("validates the authentication group separately, so phase 3 needs none of it", () => {
    expect(() => parseEnv(["auth"], { SUPABASE_URL: "https://x.supabase.co" })).toThrow(/SUPABASE_ANON_KEY is required/);
    const ok = parseEnv(["auth"], { SUPABASE_URL: "https://x.supabase.co", SUPABASE_ANON_KEY: "a".repeat(40), SUPABASE_SERVICE_ROLE_KEY: "b".repeat(40) });
    expect(ok.SUPABASE_SERVICE_ROLE_KEY).toHaveLength(40);
  });

  it("caches a validated environment and can be reset", () => {
    resetEnvCache();
    const saved = process.env.DATABASE_URL;
    process.env.DATABASE_URL = DB;
    try {
      const a = getEnv(["database"]);
      process.env.DATABASE_URL = "postgres://changed@h/d";
      expect(getEnv(["database"])).toBe(a);
      resetEnvCache();
      expect(getEnv(["database"]).DATABASE_URL).toBe("postgres://changed@h/d");
    } finally {
      if (saved === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = saved;
      resetEnvCache();
    }
  });
});

describe("secrets never leave the server", () => {
  it("redacts connection strings and secret values when an environment is printed", () => {
    const r = redactEnv({ DATABASE_URL: DB, SUPABASE_SERVICE_ROLE_KEY: "super-secret-service-key-value", CRON_SECRET: "cron-secret-value-123456", CONTENT_SOURCE: "db", EMPTY: "" });
    const text = JSON.stringify(r);
    expect(text).not.toContain("s3cretpassw0rd");
    expect(text).not.toContain("super-secret-service-key-value");
    expect(text).not.toContain("cron-secret-value");
    expect(r.DATABASE_URL).toBe("postgres://***@db.example.supabase.co:6543/postgres");
    expect(r.CONTENT_SOURCE).toBe("db");
    expect(r.EMPTY).toBeUndefined();
  });

  it("no secret variable name is ever prefixed NEXT_PUBLIC_ (Next.js would put it in the browser bundle)", () => {
    for (const name of SERVER_ONLY_NAMES) expect(name.startsWith("NEXT_PUBLIC_"), name).toBe(false);
  });
});
