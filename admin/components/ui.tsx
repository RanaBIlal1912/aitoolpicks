import Link from "next/link";
import type { ReactNode } from "react";

export const Badge = ({ value }: { value: string | null | undefined }) => <span className={`badge ${value ?? ""}`}>{(value ?? "-").replace("_", " ")}</span>;

export function Flash({ ok, err }: { ok?: string; err?: string }) {
  if (err) return <p className="flash err" role="alert">{err}</p>;
  if (ok) return <p className="flash ok" role="status">{ok}</p>;
  return null;
}

export function Pager({ path, page, pageSize, total, params = {} }: { path: string; page: number; pageSize: number; total: number; params?: Record<string, string | undefined> }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const href = (p: number) => {
    const q = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]);
    q.set("page", String(p));
    return `${path}?${q}`;
  };
  return (
    <nav className="pager" aria-label="Pages">
      {page > 1 ? <Link href={href(page - 1)}>Previous</Link> : <span className="muted">Previous</span>}
      <span>Page {page} of {pages} ({total} items)</span>
      {page < pages ? <Link href={href(page + 1)}>Next</Link> : <span className="muted">Next</span>}
    </nav>
  );
}

export const Table = ({ head, children, empty }: { head: string[]; children: ReactNode; empty?: string }) => (
  <div className="tablewrap">
    <table>
      <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
    {empty && <p className="muted" style={{ padding: "0 12px" }}>{empty}</p>}
  </div>
);

export const fmt = (iso: string | null | undefined) => (iso ? iso.replace("T", " ").slice(0, 16) : "-");
export const pick = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
