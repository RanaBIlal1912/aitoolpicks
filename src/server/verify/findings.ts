// Shared shapes and the report writers for the data verification tools (docs/platform/06-analytics-statistics-verification.md section 3).
// A finding only POINTS at a record that fails a rule. Nothing here fills in a value, and nothing here marks anything verified.

export type Severity = "error" | "warning" | "info";
export type Finding = {
  /** Stable: the same problem on the same record always has the same id. */
  id: string;
  check: string;
  severity: Severity;
  entityType: string;
  entityId: string;
  message: string;
  field?: string;
  suggestion?: string;
};
export type ReviewQueueItem = { entityType: string; entityId: string; reason: string };
export type Report = {
  generatedAt: string;
  source: string;
  /** What kind of run produced this: offline database checks, link checks, or built-site checks. */
  kind: "data" | "links" | "site";
  counts: { error: number; warning: number; info: number };
  byCheck: Record<string, { error: number; warning: number; info: number }>;
  findings: Finding[];
  humanReviewQueue: ReviewQueueItem[];
};

const ORDER: Record<Severity, number> = { error: 0, warning: 1, info: 2 };

export const finding = (check: string, severity: Severity, entityType: string, entityId: string, message: string, extra: { field?: string; suggestion?: string } = {}): Finding => ({
  id: `${check}:${entityType}:${entityId}${extra.field ? `:${extra.field}` : ""}`,
  check,
  severity,
  entityType,
  entityId,
  message,
  ...extra,
});

export function buildReport(kind: Report["kind"], source: string, findings: Finding[], humanReviewQueue: ReviewQueueItem[] = [], generatedAt = new Date().toISOString()): Report {
  const sorted = [...findings].sort((a, b) => ORDER[a.severity] - ORDER[b.severity] || a.check.localeCompare(b.check) || a.entityId.localeCompare(b.entityId) || a.id.localeCompare(b.id));
  const counts = { error: 0, warning: 0, info: 0 };
  const byCheck: Report["byCheck"] = {};
  for (const f of sorted) {
    counts[f.severity]++;
    (byCheck[f.check] ??= { error: 0, warning: 0, info: 0 })[f.severity]++;
  }
  return { generatedAt, source, kind, counts, byCheck, findings: sorted, humanReviewQueue };
}

/** CI fails on errors, never on warnings. */
export const hasErrors = (r: Report) => r.counts.error > 0;

export function reportMarkdown(r: Report): string {
  const lines = [
    `# Data verification (${r.kind})`,
    "",
    `- Generated: ${r.generatedAt}`,
    `- Source: ${r.source}`,
    `- Result: **${r.counts.error} error(s), ${r.counts.warning} warning(s), ${r.counts.info} note(s)**`,
    "",
    "Automated checks only point at records that break a rule. A reachable page does not make a tool verified, and nothing in this report changes a verification or pricing status: that is a person's decision, recorded with a name, date and method.",
    "",
    "## By check",
    "",
    "| Check | Errors | Warnings | Notes |",
    "| --- | ---: | ---: | ---: |",
    ...Object.entries(r.byCheck).map(([k, v]) => `| ${k} | ${v.error} | ${v.warning} | ${v.info} |`),
    "",
  ];
  for (const sev of ["error", "warning", "info"] as Severity[]) {
    const list = r.findings.filter((f) => f.severity === sev);
    if (!list.length) continue;
    lines.push(`## ${sev === "error" ? "Errors" : sev === "warning" ? "Warnings" : "Notes"} (${list.length})`, "");
    const byEntity = new Map<string, Finding[]>();
    for (const f of list) (byEntity.get(`${f.entityType} ${f.entityId}`) ?? byEntity.set(`${f.entityType} ${f.entityId}`, []).get(`${f.entityType} ${f.entityId}`)!).push(f);
    for (const [entity, fs] of byEntity) {
      lines.push(`- **${entity}**`);
      for (const f of fs) lines.push(`  - \`${f.check}\`${f.field ? ` (${f.field})` : ""}: ${f.message}${f.suggestion ? ` Suggestion: ${f.suggestion}` : ""}`);
    }
    lines.push("");
  }
  if (r.humanReviewQueue.length) {
    lines.push(`## Needs a person (${r.humanReviewQueue.length})`, "", "| Record | Why |", "| --- | --- |", ...r.humanReviewQueue.map((q) => `| ${q.entityType} ${q.entityId} | ${q.reason} |`), "");
  }
  return lines.join("\n");
}
