// Checking a shared secret sent as "Authorization: Bearer <secret>", without leaking how much of it matched.
import { createHash, timingSafeEqual } from "node:crypto";

const digest = (s: string) => createHash("sha256").update(s).digest();

/** True only for exactly "Bearer <secret>". Compares fixed-length hashes in constant time; an empty or missing secret never matches. */
export function checkBearer(header: string | null | undefined, secret: string | undefined): boolean {
  if (!secret || secret.length < 16 || !header) return false;
  const m = /^Bearer (.+)$/.exec(header);
  if (!m) return false;
  return timingSafeEqual(digest(m[1]), digest(secret));
}
