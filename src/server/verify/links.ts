// Network checks (design section 3.1, check 3): are the addresses we publish still reachable, and do they still lead to the same site?
// Polite by design: one request at a time per host with a pause, a small global limit, a short timeout, HEAD first. Run on a schedule, never at build time.
// A reachable address proves nothing about a price or a feature. Results are warnings and notes; they can never change a verification status.
import type { Sql } from "../db/client.ts";
import { finding, type Finding } from "./findings.ts";

export type UrlRef = { url: string; entityType: string; entityId: string; field: string };
export type LinkKind = "ok" | "blocked" | "broken" | "moved-off-site";
export type LinkResult = { url: string; status: number | null; finalUrl: string | null; kind: LinkKind; error?: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
const hostOf = (u: string) => {
  try {
    return new URL(u).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
};

/** Every outward address the site shows, with where it belongs. */
export async function collectUrls(sql: Sql): Promise<UrlRef[]> {
  const refs: UrlRef[] = [];
  for (const t of await sql<Row[]>`select slug, website_url, official_url, pricing_url, pricing_source_url from tools where deleted_at is null and status = 'published'`) {
    for (const f of ["website_url", "official_url", "pricing_url", "pricing_source_url"]) if (t[f]) refs.push({ url: t[f], entityType: "tool", entityId: t.slug, field: f });
  }
  for (const s of await sql<Row[]>`select t.slug, s.url from tool_sources s join tools t on t.id = s.tool_id where t.deleted_at is null and t.status = 'published'`) refs.push({ url: s.url, entityType: "tool", entityId: s.slug, field: "source" });
  for (const n of await sql<Row[]>`select slug, source_url from news_items where deleted_at is null and status = 'published'`) refs.push({ url: n.source_url, entityType: "news", entityId: n.slug, field: "source_url" });
  return refs;
}

export type FetchLike = (url: string, init: { method: string; redirect: "follow"; signal: AbortSignal; headers: Record<string, string> }) => Promise<{ status: number; url: string; body?: { cancel?: () => Promise<void> } | null }>;
const USER_AGENT = "AIToolPicksLinkCheck/1.0 (data quality check; contact via the site's contact page)";

export async function checkUrl(url: string, options: { fetch?: FetchLike; timeoutMs?: number } = {}): Promise<LinkResult> {
  const doFetch = options.fetch ?? (fetch as unknown as FetchLike);
  const attempt = async (method: "HEAD" | "GET") => {
    const res = await doFetch(url, { method, redirect: "follow", signal: AbortSignal.timeout(options.timeoutMs ?? 8000), headers: { "User-Agent": USER_AGENT, Accept: "text/html,*/*;q=0.8" } });
    await res.body?.cancel?.().catch(() => undefined); // read no page, just the answer
    return res;
  };
  try {
    let res = await attempt("HEAD");
    if (res.status === 405 || res.status === 501 || res.status === 403 || res.status === 400) res = await attempt("GET"); // some hosts refuse HEAD
    const final = res.url || url;
    if (res.status >= 200 && res.status < 300) return { url, status: res.status, finalUrl: final, kind: hostOf(final) !== hostOf(url) ? "moved-off-site" : "ok" };
    if ([401, 403, 429, 999].includes(res.status)) return { url, status: res.status, finalUrl: final, kind: "blocked" };
    return { url, status: res.status, finalUrl: final, kind: "broken" };
  } catch (e) {
    return { url, status: null, finalUrl: null, kind: "broken", error: (e as Error).name === "TimeoutError" ? "timed out" : "could not connect" };
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Check each distinct address once. Same host: one at a time with a pause. Different hosts: up to `concurrency` at once. */
export async function checkUrls(refs: UrlRef[], options: { fetch?: FetchLike; concurrency?: number; perHostDelayMs?: number; timeoutMs?: number; limit?: number } = {}): Promise<Map<string, LinkResult>> {
  const urls = [...new Set(refs.map((r) => r.url))].slice(0, options.limit ?? Infinity);
  const byHost = new Map<string, string[]>();
  for (const u of urls) (byHost.get(hostOf(u)) ?? byHost.set(hostOf(u), []).get(hostOf(u))!).push(u);
  const results = new Map<string, LinkResult>();
  const queue = [...byHost.values()];
  const worker = async () => {
    for (let group = queue.shift(); group; group = queue.shift()) {
      for (const [i, u] of group.entries()) {
        if (i > 0) await sleep(options.perHostDelayMs ?? 400);
        results.set(u, await checkUrl(u, { fetch: options.fetch, timeoutMs: options.timeoutMs }));
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, options.concurrency ?? 4) }, worker));
  return results;
}

export function linkFindings(refs: UrlRef[], results: Map<string, LinkResult>): Finding[] {
  const out: Finding[] = [];
  for (const r of refs) {
    const res = results.get(r.url);
    if (!res) continue;
    const where = { field: r.field };
    if (res.kind === "broken") out.push(finding("link", "warning", r.entityType, r.entityId, `${r.url} ${res.status ? `answered ${res.status}` : `${res.error ?? "failed"}`}.`, { ...where, suggestion: "Open it in a browser; it may have moved or be temporarily down." }));
    else if (res.kind === "moved-off-site") out.push(finding("link", "warning", r.entityType, r.entityId, `${r.url} now leads to ${res.finalUrl}.`, { ...where, suggestion: "Check that the destination is still the right page." }));
    else if (res.kind === "blocked") out.push(finding("link", "info", r.entityType, r.entityId, `${r.url} refused an automated check (${res.status}), so it could not be tested.`, where));
  }
  return out;
}
