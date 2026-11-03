// App-level rate limiter for limits the edge rules cannot express (docs/platform/03-security-and-access.md section 6): per e-mail address, per member.
// A fixed window per key and route, counted in one atomic statement in rate_limit_hits. Keys are hashed, so the table holds no e-mail addresses or IPs.
import { createHmac } from "node:crypto";
import type { Sql } from "../db/client.ts";

export type Limit = { limit: number; windowSeconds: number };
export type LimitResult = { allowed: boolean; count: number; remaining: number; retryAfterSeconds: number };

export const LIMITS = {
  /** sign-in attempts per e-mail address */
  login: { limit: 5, windowSeconds: 15 * 60 },
  /** changes made by one team member */
  adminMutation: { limit: 120, windowSeconds: 60 },
  /** tool submissions per hashed IP */
  submission: { limit: 5, windowSeconds: 60 * 60 },
} as const satisfies Record<string, Limit>;

export const keyHash = (key: string, salt: string) => createHmac("sha256", salt).update(key.trim().toLowerCase()).digest("hex");

/** Count one attempt and say whether it is allowed. `at` is for tests. */
export async function consume(sql: Sql, key: string, route: string, limit: Limit, options: { salt: string; at?: Date }): Promise<LimitResult> {
  const nowMs = (options.at ?? new Date()).getTime();
  const windowMs = limit.windowSeconds * 1000;
  const start = new Date(Math.floor(nowMs / windowMs) * windowMs);
  const [row] = await sql<{ count: number }[]>`
    insert into rate_limit_hits (key_hash, route, window_start) values (${keyHash(key, options.salt)}, ${route}, ${start})
    on conflict (key_hash, route, window_start) do update set count = rate_limit_hits.count + 1 returning count`;
  const count = Number(row.count);
  return { allowed: count <= limit.limit, count, remaining: Math.max(0, limit.limit - count), retryAfterSeconds: Math.max(1, Math.ceil((start.getTime() + windowMs - nowMs) / 1000)) };
}

/** Remove counters older than the given number of seconds (a scheduled job calls this). */
export async function prune(sql: Sql, olderThanSeconds = 3600): Promise<number> {
  const [row] = await sql<{ n: string }[]>`select public.prune_rate_limit_hits(make_interval(secs => ${olderThanSeconds})) as n`;
  return Number(row.n);
}
