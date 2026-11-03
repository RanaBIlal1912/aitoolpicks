// What the admin Verification page shows: the offline data checks, run live (they are a handful of queries), grouped for a person to work through.
import type { Sql } from "../db/client.ts";
import { AuthError, can, type Member } from "../auth/authorize.ts";
import { runDataChecks } from "../verify/checks.ts";
import { buildReport, type Report } from "../verify/findings.ts";

export async function dataVerification(sql: Sql, member: Member, options: { today?: string } = {}): Promise<Report> {
  if (!can(member, "verification:read")) throw new AuthError(403, "forbidden", "missing permission verification:read");
  const { findings, humanReviewQueue } = await runDataChecks(sql, options);
  return buildReport("data", "database", findings, humanReviewQueue);
}

/** Just the counts, for the "needs attention" card on the front page. */
export async function attentionCounts(sql: Sql, member: Member, options: { today?: string } = {}) {
  if (!can(member, "verification:read")) return null;
  const r = await dataVerification(sql, member, options);
  return { ...r.counts, queue: r.humanReviewQueue.length };
}
