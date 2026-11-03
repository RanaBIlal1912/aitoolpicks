import Link from "next/link";
import { CONTENT, listContent, type ContentKind } from "../../src/server/admin/queries.ts";
import type { Member } from "../../src/server/auth/authorize.ts";
import { getDeps } from "../lib/deps.ts";
import { changeStatusAction } from "../app/(console)/actions.ts";
import { Badge, Flash, fmt, pick, Pager, Table } from "./ui.tsx";

type SP = Record<string, string | string[] | undefined>;
const AREA: Record<ContentKind, string> = { tools: "tools", reviews: "reviews", blog: "blog", news: "news" };

/** A list screen with search, status filter and paging. */
export async function ContentList({ kind, path, member, sp }: { kind: ContentKind; path: string; member: Member; sp: SP }) {
  const q = pick(sp.q) ?? "";
  const status = pick(sp.status) ?? "";
  const page = Number(pick(sp.page)) || 1;
  const data = await listContent(getDeps().sql, member, kind, { q, status, page });
  return (
    <>
      <h1>{CONTENT[kind].label}</h1>
      <Flash ok={pick(sp.ok)} err={pick(sp.err)} />
      <form className="toolbar" method="get">
        <label>Search<input name="q" defaultValue={q} maxLength={100} placeholder="name or address" /></label>
        <label>
          Status
          <select name="status" defaultValue={status}>
            <option value="">All</option>
            {["draft", "in_review", "published", "archived"].map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </label>
        <button type="submit">Filter</button>
      </form>
      <Table head={["Title", "Address", "Status", "Updated"]} empty={data.rows.length === 0 ? "Nothing matches." : undefined}>
        {data.rows.map((r) => (
          <tr key={r.slug}>
            <td><Link href={`${path}/${r.slug}`}>{r.title}</Link></td>
            <td className="muted">{r.slug}</td>
            <td><Badge value={r.status} /></td>
            <td className="muted">{fmt(r.updated_at)}</td>
          </tr>
        ))}
      </Table>
      <Pager path={path} page={data.page} pageSize={data.pageSize} total={data.total} params={{ q, status }} />
    </>
  );
}

/** The status control: offers only the states this member may move the item to. */
export function StatusControl({ kind, slug, status, path, member }: { kind: ContentKind; slug: string; status: string; path: string; member: Member }) {
  const a = AREA[kind];
  const can = (p: string) => member.permissions.has(`${a}:${p}`);
  const options = [
    ...(can("update") ? [["draft", "Draft"], ["in_review", "In review"]] : []),
    ...(can("publish") ? [["published", "Published"]] : []),
    ...(can("archive") ? [["archived", "Archived"]] : []),
  ].filter(([v]) => v !== status);
  if (options.length === 0) return <p className="muted">Your role cannot change the status.</p>;
  return (
    <form action={changeStatusAction} className="row">
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="back" value={path} />
      <label>Move to<select name="to">{options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
      <button type="submit">Change status</button>
    </form>
  );
}
