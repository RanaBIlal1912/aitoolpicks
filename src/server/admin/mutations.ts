// Write side of the admin area. Each function checks the permission and the row/field scope, changes the row and writes the audit row in one
// transaction, and then (outside it) asks the host to rebuild the public site if what is public changed.
// Deliberately NOT here yet: creating items, and editing pricing, verification, review method or affiliate data. Those are the "sensitive" changes
// that need the revision and second-approver workflow (design section 5) and arrive in a later step.
import { z } from "zod";
import type { Sql } from "../db/client.ts";
import { writeAudit } from "../auth/audit.ts";
import { AuthError, canActOnRow, canChangeFields, type AuthDeps, type Member } from "../auth/authorize.ts";
import { CONTENT, type ContentKind } from "./queries.ts";

export type Ctx = { requestId?: string; ip?: string };
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = Record<string, any>;
const STATUSES = ["draft", "in_review", "published", "archived"] as const;
export type Status = (typeof STATUSES)[number];
const permissionKind = { tools: "tools", reviews: "reviews", blog: "blog", news: "news" } as const;

/** Ask the host to rebuild the public site. Never throws: a failed hook must not undo a saved change. */
export async function requestRebuild(hookUrl: string | undefined, fetchImpl: typeof fetch = fetch): Promise<"not_configured" | "requested" | "failed"> {
  if (!hookUrl) return "not_configured";
  try {
    const res = await fetchImpl(hookUrl, { method: "POST", signal: AbortSignal.timeout(5000) });
    return res.ok ? "requested" : "failed";
  } catch {
    return "failed";
  }
}

export type DeployDeps = { deployHookUrl?: string; fetch?: typeof fetch };

/** Move an item between draft, in review, published and archived. */
export async function setStatus(deps: AuthDeps & DeployDeps, member: Member, kind: ContentKind, slug: string, to: Status, ctx: Ctx = {}) {
  if (!STATUSES.includes(to)) throw new AuthError(409, "bad_status");
  const c = CONTENT[kind];
  const area = permissionKind[kind];
  const permission = to === "published" ? `${area}:publish` : to === "archived" ? `${area}:archive` : `${area}:update`;
  if (!member.permissions.has(permission)) throw new AuthError(403, "forbidden", `missing permission ${permission}`);

  const result = await deps.sql.begin(async (raw) => {
    const tx = raw as unknown as Sql;
    const [row] = await tx<Row[]>`select id, status::text as status, created_by from ${tx.unsafe(c.table)} where slug = ${slug} and deleted_at is null for update`;
    if (!row) throw new AuthError(409, "not_found");
    if (row.status === to) return { changed: false, from: row.status as string };
    // Moving a row back to draft or review is an edit, so a contributor's own-drafts scope applies; publishing and archiving are never scoped to rows.
    if ((to === "draft" || to === "in_review") && !canActOnRow(member, permission, { createdBy: row.created_by === null ? null : Number(row.created_by), status: row.status })) {
      throw new AuthError(403, "forbidden", "not allowed on this item");
    }
    try {
      await tx`update ${tx.unsafe(c.table)} set status = ${to}::content_status, updated_by = ${member.id} where id = ${row.id}`;
    } catch (e) {
      // The database refuses states that break its rules (for example a hands-on review without a testing record). Say so plainly.
      if ((e as { code?: string }).code === "23514") throw new AuthError(409, "rule_violation", (e as Error).message);
      throw e;
    }
    await writeAudit(tx, { actor: member.id, action: "content.status_changed", entityType: c.table, entityId: slug, before: { status: row.status }, after: { status: to }, ...ctx }, { ipSalt: deps.ipSalt });
    return { changed: true, from: row.status as string };
  });
  const rebuild = result.changed && (to === "published" || to === "archived" || result.from === "published") ? await requestRebuild(deps.deployHookUrl, deps.fetch) : "not_needed";
  return { ...result, to, rebuild };
}

const toolBasics = z
  .object({
    tagline: z.string().trim().min(5).max(160),
    description: z.string().trim().min(20).max(1200),
    key_feature: z.string().trim().max(200).nullable(),
  })
  .strict();

/** Edit the plain descriptive fields of a tool. Pricing, verification and affiliate data cannot be changed here. */
export async function updateToolBasics(deps: AuthDeps & DeployDeps, member: Member, slug: string, input: unknown, ctx: Ctx = {}) {
  const data = toolBasics.parse(input);
  const fields = Object.keys(data);
  if (!canChangeFields(member, "tools:update", fields)) throw new AuthError(403, "forbidden", "missing permission tools:update");
  const result = await deps.sql.begin(async (raw) => {
    const tx = raw as unknown as Sql;
    const [row] = await tx<Row[]>`select id, status::text as status, created_by, tagline, description, key_feature from tools where slug = ${slug} and deleted_at is null for update`;
    if (!row) throw new AuthError(409, "not_found");
    if (!canActOnRow(member, "tools:update", { createdBy: row.created_by === null ? null : Number(row.created_by), status: row.status })) throw new AuthError(403, "forbidden", "not allowed on this item");
    const before = { tagline: row.tagline, description: row.description, key_feature: row.key_feature };
    if (JSON.stringify(before) === JSON.stringify(data)) return { changed: false, published: row.status === "published" };
    await tx`update tools set tagline = ${data.tagline}, description = ${data.description}, key_feature = ${data.key_feature}, updated_by = ${member.id} where id = ${row.id}`;
    await writeAudit(tx, { actor: member.id, action: "tool.updated", entityType: "tools", entityId: slug, before, after: data, ...ctx }, { ipSalt: deps.ipSalt });
    return { changed: true, published: row.status === "published" };
  });
  const rebuild = result.changed && result.published ? await requestRebuild(deps.deployHookUrl, deps.fetch) : "not_needed";
  return { ...result, rebuild };
}

/** Show or hide a category on the public site. */
export async function setCategoryVisibility(deps: AuthDeps & DeployDeps, member: Member, id: number, visible: boolean, ctx: Ctx = {}) {
  if (!member.permissions.has("categories:visibility")) throw new AuthError(403, "forbidden", "missing permission categories:visibility");
  const result = await deps.sql.begin(async (raw) => {
    const tx = raw as unknown as Sql;
    const [row] = await tx<Row[]>`select slug, is_visible from categories where id = ${id} and deleted_at is null for update`;
    if (!row) throw new AuthError(409, "not_found");
    if (row.is_visible === visible) return { changed: false };
    await tx`update categories set is_visible = ${visible}, updated_by = ${member.id} where id = ${id}`;
    await writeAudit(tx, { actor: member.id, action: "category.visibility_changed", entityType: "categories", entityId: row.slug, before: { is_visible: row.is_visible }, after: { is_visible: visible }, ...ctx }, { ipSalt: deps.ipSalt });
    return { changed: true };
  });
  const rebuild = result.changed ? await requestRebuild(deps.deployHookUrl, deps.fetch) : "not_needed";
  return { ...result, rebuild };
}
