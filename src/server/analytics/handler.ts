// The request side of event collection, independent of any framework so it can be tested and later mounted as /api/events (a Route Handler cannot exist
// in a static export, so this waits for the hosting phase). It answers 204 whether the event was kept or dropped: the sender learns nothing.
import type { Sql } from "../db/client.ts";
import { ingestEvent } from "./ingest.ts";

export type EventRequest = {
  method: string;
  contentType?: string;
  body: string;
  origin?: string;
  userAgent?: string;
  country?: string;
  ip?: string;
};
export type EventDeps = { sql: Sql; enabled: boolean; salt?: string; visitorHash?: boolean; /** The site's own origin, for example https://example.com */ siteOrigin?: string };
export const MAX_BODY_BYTES = 2048;

export async function handleEventRequest(deps: EventDeps, req: EventRequest): Promise<{ status: 204 | 400 | 403 | 405 | 413 | 415 }> {
  if (req.method !== "POST") return { status: 405 };
  if (!/^(application\/json|text\/plain)\b/i.test(req.contentType ?? "")) return { status: 415 };
  if (Buffer.byteLength(req.body, "utf8") > MAX_BODY_BYTES) return { status: 413 };
  if (deps.siteOrigin && req.origin && req.origin !== deps.siteOrigin) return { status: 403 };
  if (!deps.enabled) return { status: 204 }; // switched off: accept and ignore, store and parse nothing
  let input: unknown;
  try {
    input = JSON.parse(req.body);
  } catch {
    return { status: 400 };
  }
  await ingestEvent(deps.sql, input, { enabled: true, userAgent: req.userAgent, country: req.country, ip: req.ip, salt: deps.salt, visitorHash: deps.visitorHash });
  return { status: 204 };
}
