// Writes automated results into the verification history (verification_checks, automated = true). By design these rows can never change what the site
// says: the status stored on each row is the tool's CURRENT human-recorded status, copied unchanged, and the tools table is not written at all.
// A database CHECK also refuses an automated row that names a person.
import type { Sql } from "../db/client.ts";
import type { Finding } from "./findings.ts";

export async function recordAutomated(sql: Sql, findings: Finding[], method: string): Promise<number> {
  const byTool = new Map<string, Finding[]>();
  for (const f of findings) if (f.entityType === "tool") (byTool.get(f.entityId) ?? byTool.set(f.entityId, []).get(f.entityId)!).push(f);
  let written = 0;
  await sql.begin(async (raw) => {
    const tx = raw as unknown as Sql;
    for (const [slug, list] of byTool) {
      const notes = list.slice(0, 6).map((f) => `${f.severity}: ${f.message}`).join(" | ").slice(0, 900);
      const rows = await tx`
        insert into verification_checks (tool_id, status, method, notes, automated, checked_by)
        select t.id, t.verification_status, ${method}, ${`${list.length} finding(s). ${notes}`}, true, null from tools t where t.slug = ${slug} returning id`;
      written += rows.length;
    }
  });
  return written;
}
