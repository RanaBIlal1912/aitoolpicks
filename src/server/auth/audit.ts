// Audit log writer (docs/platform/03-security-and-access.md section 8). Called inside the same transaction as the change it records.
// Secrets never reach the table: values under keys that look like secrets are replaced, and an IP address is stored only as a salted hash.
import { createHmac } from "node:crypto";
import type { Sql } from "../db/client.ts";

export type AuditEntry = {
  actor: number | null;
  /** dotted lower-case verb, for example team.invited (the table has a CHECK for the shape) */
  action: string;
  entityType?: string;
  entityId?: string | number;
  before?: unknown;
  after?: unknown;
  requestId?: string;
  ip?: string;
};

const SECRET_KEY = /pass(word|phrase)?|token|secret|api[_-]?key|service[_-]?role|authorization|cookie|credential|private[_-]?key|\bkey$/i;

/** A copy of `value` with the content of every secret-looking key replaced. Deep, cycle-safe, never throws. */
export function redact(value: unknown, depth = 0, seen = new WeakSet<object>()): unknown {
  if (value === null || typeof value !== "object") return typeof value === "string" && value.length > 2000 ? `${value.slice(0, 2000)}…` : value;
  if (seen.has(value) || depth > 8) return "[truncated]";
  seen.add(value);
  if (Array.isArray(value)) return value.map((v) => redact(v, depth + 1, seen));
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, SECRET_KEY.test(k) ? "[redacted]" : redact(v, depth + 1, seen)]));
}

export function hashIp(ip: string | undefined, salt: string | undefined): string | null {
  if (!ip || !salt) return null; // no salt configured: store nothing rather than a raw or weakly hashed address
  return createHmac("sha256", salt).update(ip.trim()).digest("hex");
}

export async function writeAudit(sql: Sql, e: AuditEntry, options: { ipSalt?: string } = {}): Promise<void> {
  const before = e.before === undefined ? null : sql.json(redact(e.before) as never);
  const after = e.after === undefined ? null : sql.json(redact(e.after) as never);
  await sql`
    insert into audit_logs (actor_member_id, action, entity_type, entity_id, before, after, request_id, ip_hash)
    values (${e.actor}, ${e.action}, ${e.entityType ?? ""}, ${e.entityId === undefined ? "" : String(e.entityId)}, ${before}, ${after}, ${e.requestId ?? null}, ${hashIp(e.ip, options.ipSalt)})`;
}
