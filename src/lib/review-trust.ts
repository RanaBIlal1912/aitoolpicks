// What a review is allowed to claim about how it was made. The rules live here so one test can enforce them for every review.
//
// "documentation"  Editorial research: written from the vendor's official pages and our catalog record. No one ran the product for the page.
// "hands-on"       A named person used the product on real tasks on stated dates, and recorded it (see docs/REVIEW_TEMPLATE.md).
//
// A review may carry the "hands-on" label only when a complete testing record is attached. Nothing here invents a score or a rating.

export type ReviewMethod = "documentation" | "hands-on";

export type HandsOnTest = {
  testedBy: string;
  /** Their job or relationship to the product, e.g. "freelance writer, paying customer". */
  role: string;
  /** The plan used and what was paid ("Pro, paid" / "free tier"). */
  plan: string;
  /** Account region, because prices and features differ. */
  region: string;
  testedFrom: string;
  testedTo: string;
  hours?: number;
  tasks: { task: string; result: string }[];
  worked: string[];
  failed: string[];
  /** Vendor claims the tester could not reproduce. */
  notReproduced?: string[];
  /** An explicit statement, even if it is "None": affiliate link configured? free account from the vendor? */
  conflicts: string;
  /** Where the record of the testing lives (a public repository, a document, a recording). */
  evidence: { label: string; url?: string }[];
  /** The tester's own screenshots, in `public/`. */
  screenshots: { src: string; alt: string; caption: string }[];
};

export type ReviewTrust = {
  method: ReviewMethod;
  /** Who stands behind the page. Defaults to the site's editors. */
  reviewer?: string;
  testing?: HandsOnTest;
};

export const DEFAULT_REVIEWER = "AI Tool Picks editors";
const DATE = /^\d{4}-\d{2}-\d{2}$/;

export const METHOD_LABEL: Record<ReviewMethod, string> = {
  documentation: "Editorial research",
  "hands-on": "Hands-on tested",
};

export function reviewerOf(r: ReviewTrust): string {
  return r.method === "hands-on" && r.testing ? r.testing.testedBy : (r.reviewer ?? DEFAULT_REVIEWER);
}

/** Reasons a review may not be published with its method label. Empty means it is consistent. `today` and `fileExists` are injectable for tests. */
export function trustProblems(r: ReviewTrust, today: string, fileExists: (src: string) => boolean = () => true): string[] {
  const p: string[] = [];
  if (r.method !== "documentation" && r.method !== "hands-on") return ["method must be \"documentation\" or \"hands-on\""];
  if (r.method === "documentation") {
    if (r.testing) p.push("a documentation-based review must not carry a testing record; label it hands-on only if the testing really happened");
    return p;
  }
  const t = r.testing;
  if (!t) return ["a hands-on review needs a testing record"];
  for (const k of ["testedBy", "role", "plan", "region", "conflicts"] as const) if (!t[k]?.trim()) p.push(`testing.${k} is empty`);
  for (const k of ["testedFrom", "testedTo"] as const) {
    if (!DATE.test(t[k] ?? "")) p.push(`testing.${k} must be a date (YYYY-MM-DD)`);
    else if (t[k] > today) p.push(`testing.${k} is in the future`);
  }
  if (DATE.test(t.testedFrom ?? "") && DATE.test(t.testedTo ?? "") && t.testedTo < t.testedFrom) p.push("testing.testedTo is before testing.testedFrom");
  if (t.hours !== undefined && !(t.hours > 0)) p.push("testing.hours must be positive");
  if (!t.tasks?.length || t.tasks.some((x) => !x.task?.trim() || !x.result?.trim())) p.push("list at least one task, each with what was run and what it produced");
  if (!t.worked?.length) p.push("say what worked");
  if (!t.failed?.length) p.push("say what failed or needed manual fixing (write that nothing failed only if it is true)");
  if (!t.evidence?.length) p.push("attach at least one piece of evidence");
  for (const e of t.evidence ?? []) if (!e.label?.trim() || (e.url && !/^https:\/\//.test(e.url))) p.push(`evidence "${e.label}" needs a label and an https address`);
  for (const s of t.screenshots ?? []) {
    if (!s.alt?.trim() || !s.caption?.trim()) p.push(`screenshot ${s.src} needs alt text and a caption`);
    if (!fileExists(s.src)) p.push(`screenshot ${s.src} does not exist in public/`);
  }
  return p;
}
