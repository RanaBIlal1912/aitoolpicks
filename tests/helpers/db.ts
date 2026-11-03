// Helpers for tests that need the migrated test database (see tests/global-setup.ts).
import { inject } from "vitest";
import { createSql, type Sql } from "../../src/server/db/client.ts";

export const pg = () => inject("pg");

let counter = 0;

/** A fresh database cloned from the migrated template. Returns a superuser connection and a function that drops the database. */
export async function freshDatabase(): Promise<{ sql: Sql; url: string; name: string; drop: () => Promise<void> }> {
  const info = pg();
  if (!info.available) throw new Error(`database unavailable: ${info.reason}`);
  const name = `t_${process.pid}_${Date.now()}_${counter++}`;
  const admin = createSql(info.adminUrl, { ssl: "disable" });
  await admin.unsafe(`create database ${name} template ${info.template}`);
  await admin.end({ timeout: 5 });
  const url = info.adminUrl.replace(/\/postgres$/, `/${name}`);
  const sql = createSql(url, { ssl: "disable" });
  return {
    sql,
    url,
    name,
    drop: async () => {
      await sql.end({ timeout: 5 });
      const a = createSql(info.adminUrl, { ssl: "disable" });
      await a.unsafe(`drop database if exists ${name} with (force)`);
      await a.end({ timeout: 5 });
    },
  };
}

/** Run `fn` as the given role (SET ROLE on a dedicated connection), then switch back. */
export async function asRole<T>(sql: Sql, role: "app" | "anon" | "authenticated", fn: (s: Sql) => Promise<T>): Promise<T> {
  const conn = await sql.reserve();
  try {
    await conn.unsafe(`set role ${role}`);
    return await fn(conn as unknown as Sql);
  } finally {
    await conn.unsafe("reset role");
    conn.release();
  }
}

/** The error a statement raises, or null if it succeeded. Lets a test assert "this must be refused" in one line. */
export async function failure(run: () => Promise<unknown>): Promise<{ code?: string; message: string } | null> {
  try {
    await run();
    return null;
  } catch (e) {
    const err = e as { code?: string; message?: string };
    return { code: err.code, message: err.message ?? String(e) };
  }
}
