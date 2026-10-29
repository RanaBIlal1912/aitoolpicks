"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PRICING_MODEL_LABEL, TOOLS, getCategory, getTool } from "@/data/tools";
import AffLink from "./AffLink";
import { formatChecked } from "@/lib/dates";

const DEFAULT_IDS = ["claude", "mistral"];

function ToolSelect({ id, label, value, onChange, taken }: { id: string; label: string; value: string; onChange: (v: string) => void; taken: string[] }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-muted">
        {label}
      </label>
      <select id={id} className="cur !w-full" value={value} onChange={(e) => onChange(e.target.value)}>
        {TOOLS.map((t) => (
          <option key={t.id} value={t.id} disabled={taken.includes(t.id) && t.id !== value}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function Row({ label, cells }: { label: string; cells: React.ReactNode[] }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      {cells.map((c, i) => (
        <td key={i}>{c}</td>
      ))}
    </tr>
  );
}

const STATUS = { verified: "Verified from the official page", partial: "Partly verified", unverified: "Not verified" } as const;

export default function CompareMatrix() {
  const [ids, setIds] = useState<string[]>(DEFAULT_IDS);

  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("ids");
    if (!p) return;
    const parsed = p.split(",").filter((x, i, a) => getTool(x) && a.indexOf(x) === i).slice(0, 3);
    if (parsed.length >= 2) setIds(parsed);
  }, []);

  const tools = ids.map((id) => getTool(id)!).filter(Boolean);
  const setAt = (i: number, v: string) => setIds((cur) => cur.map((x, j) => (j === i ? v : x)));
  const addThird = () => setIds((cur) => (cur.length < 3 ? [...cur, TOOLS.find((t) => !cur.includes(t.id))!.id] : cur));
  const removeThird = () => setIds((cur) => cur.slice(0, 2));

  return (
    <div className="glass rounded-[26px] p-5 md:p-7">
      <div className={`grid gap-4 ${ids.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}>
        {ids.map((id, i) => (
          <ToolSelect key={i} id={`cmp-${i}`} label={`Tool ${String.fromCharCode(65 + i)}`} value={id} onChange={(v) => setAt(i, v)} taken={ids} />
        ))}
      </div>
      <div className="mt-3">
        {ids.length < 3 ? (
          <button type="button" className="chip" onClick={addThird}>
            + Add a third tool
          </button>
        ) : (
          <button type="button" className="chip" onClick={removeThird}>
            Remove third tool
          </button>
        )}
      </div>

      <div className="table-wrap mt-6 border border-white/10">
        <table className="cmp">
          <caption className="sr-only">Comparison of {tools.map((t) => t.name).join(", ")}</caption>
          <thead>
            <tr>
              <th scope="col">&nbsp;</th>
              {tools.map((t) => (
                <th key={t.id} scope="col">
                  {t.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <Row label="Vendor" cells={tools.map((t) => t.vendor)} />
            <Row label="Category" cells={tools.map((t) => getCategory(t.category)?.label)} />
            <Row label="What it is" cells={tools.map((t) => t.tagline)} />
            <Row label="Intended for" cells={tools.map((t) => t.bestFor)} />
            <Row
              label="Free plan"
              cells={tools.map((t) => (t.freePlan === true ? "Yes, documented" : t.freePlan === false ? "No" : <span className="text-muted">Not stated / not verified</span>))}
            />
            <Row label="Pricing model" cells={tools.map((t) => PRICING_MODEL_LABEL[t.pricingModel])} />
            <Row
              label="Plans (merchant currency)"
              cells={tools.map((t) =>
                t.plans.length ? (
                  <ul key={t.id} className="space-y-1">
                    {t.plans.map((p) => (
                      <li key={p.name}>
                        <span className="text-muted">{p.name}:</span> {p.price}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-muted">Not captured</span>
                ),
              )}
            />
            <Row label="Pricing status" cells={tools.map((t) => `${STATUS[t.pricingStatus]}, checked ${formatChecked(t.checked)}`)} />
            <Row
              label="Read more"
              cells={tools.map((t) => (
                <span key={t.id} className="flex flex-col gap-1">
                  <Link href={`/tools/${t.id}/`} className="text-[#9db4d6] underline">
                    Full details and pricing
                  </Link>
                  <a href={t.pricingSource} target="_blank" rel="noopener noreferrer" className="text-[#9db4d6] underline">
                    Official pricing page
                  </a>
                </span>
              ))}
            />
            <Row label="Visit" cells={tools.map((t) => <AffLink key={t.id} id={t.id} className="btn-ghost btn-sm" />)} />
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-muted">
        Plans are shown in each merchant&rsquo;s own currency, exactly as listed on its pricing page. Where a price could not be read, the row says so
        instead of guessing.
      </p>
    </div>
  );
}
