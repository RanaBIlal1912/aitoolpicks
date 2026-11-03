import Link from "next/link";
import { notFound } from "next/navigation";
import { getContentItem, type ContentKind } from "../../src/server/admin/queries.ts";
import type { Member } from "../../src/server/auth/authorize.ts";
import { getDeps } from "../lib/deps.ts";
import { StatusControl } from "./content.tsx";
import { Badge, Flash, fmt, pick } from "./ui.tsx";

type SP = Record<string, string | string[] | undefined>;
const FIELDS: Record<"reviews" | "blog" | "news", [string, string][]> = {
  reviews: [["summary", "Summary"], ["method", "Method"], ["reviewer_name", "Reviewer"], ["best_for", "Best for"], ["skip_if", "Skip if"], ["pricing_note", "Pricing note"], ["verdict", "Verdict"]],
  blog: [["description", "Description"], ["topic", "Topic"], ["kind", "Kind"], ["category_label", "Card label"], ["region", "Region"]],
  news: [["summary", "Summary"], ["matters", "Why it matters"], ["kind", "Kind"], ["tag", "Tag"], ["published_on", "Source date"], ["source_url", "Source"]],
};
const PREVIEW_FIELD: Partial<Record<ContentKind, string>> = { blog: "body_html" };

/** Read-only detail of a review, article or news item, with the status control. Editing their text comes with the revision workflow. */
export async function ItemDetail({ kind, slug, path, member, sp }: { kind: "reviews" | "blog" | "news"; slug: string; path: string; member: Member; sp: SP }) {
  const item = await getContentItem(getDeps().sql, member, kind, slug);
  if (!item) notFound();
  const title = (item.title as string) ?? slug;
  const body = PREVIEW_FIELD[kind] ? String(item[PREVIEW_FIELD[kind]!] ?? "") : null;
  return (
    <>
      <p><Link href={`/${kind}`}>All {kind === "news" ? "news" : kind}</Link></p>
      <h1>{title}</h1>
      <Flash ok={pick(sp.ok)} err={pick(sp.err)} />
      <div className="card stack">
        <div className="row"><Badge value={item.status} /><span className="muted">Updated {fmt(item.updated_at)}{item.published_at ? `, published ${fmt(item.published_at)}` : ""}</span></div>
        <StatusControl kind={kind} slug={slug} status={item.status} path={path} member={member} />
        <dl className="facts">
          {FIELDS[kind].filter(([k]) => item[k] !== null && item[k] !== undefined && item[k] !== "").map(([k, label]) => <div key={k} style={{ display: "contents" }}><dt>{label}</dt><dd>{String(item[k])}</dd></div>)}
        </dl>
      </div>
      {body !== null && (
        <>
          <h2>Body (HTML source, {body.length.toLocaleString("en")} characters)</h2>
          <pre className="card json" style={{ maxWidth: "none", maxHeight: 360, overflow: "auto" }}>{body.slice(0, 6000)}{body.length > 6000 ? "\n…" : ""}</pre>
        </>
      )}
      <p className="muted">Editing the text of reviews, articles and news items is not available yet. It arrives with the revision and approval workflow, because their wording is part of what readers trust.</p>
    </>
  );
}
