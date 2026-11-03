// Verification report for the catalogue import (docs/platform/04-migration-and-hosting.md section 1.3). Read-only.
import type { Sql } from "../db/client.ts";
import { canonical, comparable, exportAffiliate, exportCategories, exportTools, normaliseAffiliate } from "./catalogue.ts";
import { countSource, type Source } from "./source.ts";

export type Check = { name: string; ok: boolean; detail: string };
export type VerificationReport = { ok: boolean; checkedAt: string; counts: Record<string, { source: number; database: number }>; checks: Check[] };

/** The numbers the Phase 1 audit recorded. A difference is information (the files changed since), not a failure. */
export const PHASE1_INVENTORY = { companies: 65, categories: 15, subcategories: 36, tools: 69, toolCategoryLinks: 113, pricingPlans: 288, toolSources: 139, affiliatePrograms: 15 } as const;

const one = async (sql: Sql, q: Promise<{ n: number }[]>) => (await q)[0].n;

export async function verifyCatalogue(sql: Sql, src: Source): Promise<VerificationReport> {
  const checks: Check[] = [];
  const add = (name: string, ok: boolean, detail: string) => checks.push({ name, ok, detail });
  const want = countSource(src);

  const db = {
    companies: await one(sql, sql`select count(*)::int as n from companies where deleted_at is null`),
    categories: await one(sql, sql`select count(*)::int as n from categories where parent_id is null and deleted_at is null`),
    subcategories: await one(sql, sql`select count(*)::int as n from categories where parent_id is not null and deleted_at is null`),
    tools: await one(sql, sql`select count(*)::int as n from tools where deleted_at is null`),
    toolCategoryLinks: await one(sql, sql`select count(*)::int as n from tool_categories`),
    alternatives: await one(sql, sql`select count(*)::int as n from tool_alternatives`),
    pricingPlans: await one(sql, sql`select count(*)::int as n from pricing_plans`),
    toolSources: await one(sql, sql`select count(*)::int as n from tool_sources`),
    affiliatePrograms: await one(sql, sql`select count(*)::int as n from affiliate_programs`),
  };
  const counts = Object.fromEntries(Object.keys(want).map((k) => [k, { source: want[k as keyof typeof want], database: db[k as keyof typeof db] }]));
  const countDiff = Object.entries(counts).filter(([, v]) => v.source !== v.database).map(([k, v]) => `${k}: files ${v.source}, database ${v.database}`);
  add("1. counts: database equals the files", countDiff.length === 0, countDiff.length ? countDiff.join("; ") : Object.entries(counts).map(([k, v]) => `${k} ${v.database}`).join(", "));
  const drift = Object.entries(PHASE1_INVENTORY).filter(([k, v]) => want[k as keyof typeof want] !== v).map(([k, v]) => `${k}: audit ${v}, files ${want[k as keyof typeof want]}`);
  add("1b. counts: files equal the Phase 1 audit", drift.length === 0, drift.length ? `the files changed since the audit: ${drift.join("; ")}` : "no change since the audit");

  // Round trip: export the database back to the original shape and compare field by field.
  const exportedTools = await exportTools(sql);
  const exported = new Map(exportedTools.map((t) => [t.id, canonical(comparable(t))]));
  const bad = src.tools.filter((t) => exported.get(t.id) !== canonical(comparable(t))).map((t) => t.id);
  add("2. round trip: every tool exports to its original JSON", bad.length === 0, bad.length ? `differs: ${bad.slice(0, 10).join(", ")}` : `${src.tools.length} tools identical (reviews link excluded until reviews are imported)`);
  const catsOk = canonical(await exportCategories(sql)) === canonical(src.categories);
  add("2b. round trip: categories and subcategories", catsOk, catsOk ? `${src.categories.length} categories identical, same order` : "differs");
  const aff = await exportAffiliate(sql);
  const affBad = Object.keys(src.affiliate).filter((k) => canonical(aff[k]) !== canonical(normaliseAffiliate(src.affiliate[k])));
  add("2c. round trip: affiliate programmes", affBad.length === 0 && Object.keys(aff).length === Object.keys(src.affiliate).length, affBad.length ? `differs: ${affBad.join(", ")}` : `${Object.keys(aff).length} identical`);

  // Relationships.
  const noPrimary = await one(sql, sql`select count(*)::int as n from tools t where not exists (select 1 from tool_categories c where c.tool_id = t.id and c.category_id = t.primary_category_id)`);
  const toolsWithoutPlans = await one(sql, sql`select count(*)::int as n from tools t where not exists (select 1 from pricing_plans p where p.tool_id = t.id)`);
  const noCompany = await one(sql, sql`select count(*)::int as n from tools t where not exists (select 1 from companies c where c.id = t.company_id)`);
  const noSources = await one(sql, sql`select count(*)::int as n from tools t where not exists (select 1 from tool_sources s where s.tool_id = t.id)`);
  add("3. relationships: every tool has a company, a primary category in its category list, plans and sources", noPrimary + noCompany + toolsWithoutPlans + noSources === 0,
    `primary category missing ${noPrimary}, company missing ${noCompany}, no plans ${toolsWithoutPlans}, no sources ${noSources} (foreign keys are enforced by the database itself)`);
  const unpub = await one(sql, sql`select count(*)::int as n from tools where status <> 'published' or published_at is null`);
  add("3b. every imported tool is published with a date", unpub === 0, `${unpub} not published`);

  // Slugs: the set of public tool slugs equals the set of tool ids in the files, so no tool URL appears or disappears.
  const slugs = new Set((await sql<{ slug: string }[]>`select slug from tools where deleted_at is null and status = 'published'`).map((r) => r.slug));
  const missing = src.tools.filter((t) => !slugs.has(t.id)).map((t) => t.id);
  const extra = [...slugs].filter((s) => !src.tools.some((t) => t.id === s));
  add("4. slugs: tool slugs equal the tool ids in the files", !missing.length && !extra.length, missing.length || extra.length ? `missing ${missing.join(",")}; extra ${extra.join(",")}` : `${slugs.size} slugs identical`);

  // Affiliate rules.
  const links = await one(sql, sql`select count(*)::int as n from affiliate_links`);
  const approved = await one(sql, sql`select count(*)::int as n from affiliate_programs where status = 'approved'`);
  const wantApproved = Object.values(src.affiliate).filter((e) => e.status === "approved").length;
  add("6. affiliate: statuses equal the files, no link exists, nothing is approved unless the files say so", links === 0 && approved === wantApproved, `links ${links}, approved ${approved} (files: ${wantApproved})`);

  return { ok: checks.every((c) => c.ok || c.name.startsWith("1b")), checkedAt: new Date().toISOString(), counts, checks };
}

export function reportMarkdown(r: VerificationReport, context: { host: string; commit?: string }): string {
  const lines = [
    "# Catalogue migration verification",
    "",
    `- Result: **${r.ok ? "PASS" : "FAIL"}**`,
    `- Checked: ${r.checkedAt}`,
    `- Database: ${context.host}${context.commit ? `  |  repository commit: ${context.commit}` : ""}`,
    "",
    "| Check | Result | Detail |",
    "| --- | --- | --- |",
    ...r.checks.map((c) => `| ${c.name} | ${c.ok ? "pass" : "FAIL"} | ${c.detail.replace(/\|/g, "\\|")} |`),
    "",
    "## Counts",
    "",
    "| Item | Files | Database |",
    "| --- | ---: | ---: |",
    ...Object.entries(r.counts).map(([k, v]) => `| ${k} | ${v.source} | ${v.database} |`),
    "",
    "Not covered by this report (later steps): reviews, articles, comparisons, news, roundups, models, media, redirects, render parity of the 320 pages.",
    "",
  ];
  return lines.join("\n");
}
