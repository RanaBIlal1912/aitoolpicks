"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PRICING_MODEL_LABEL, TOOLS, getCategory, getTool } from "@/data/tools";
import AffLink from "./AffLink";
import { formatChecked } from "@/lib/dates";
import { getDetail } from "@/data/detail";

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

/** A row; when the plain-text values differ between tools the row is marked, so differences stand out without picking a winner. */
function Row({ label, cells, values }: { label: string; cells: React.ReactNode[]; values?: string[] }) {
  const differs = !!values && new Set(values.map((v) => v.trim().toLowerCase())).size > 1;
  return (
    <tr className={differs ? "cmp-diff" : undefined}>
      <th scope="row">
        {label}
        {differs && <span className="mt-1 block text-[0.68rem] font-bold uppercase tracking-[0.1em] text-amber">Differs</span>}
      </th>
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
    const asked = p.split(",").filter(Boolean);
    setInvalid(asked.filter((x) => !getTool(x)));
    const parsed = asked.filter((x, i, a) => getTool(x) && a.indexOf(x) === i).slice(0, 3);
    if (parsed.length >= 2) setIds(parsed);
  }, []);

  useEffect(() => {
    try {
      history.replaceState(null, "", `${location.pathname}?ids=${ids.join(",")}`);
    } catch {
      /* ignore */
    }
  }, [ids]);
  const tools = ids.map((id) => getTool(id)!).filter(Boolean);
  const dets = tools.map((t) => getDetail(t.id));
  const list = (pick: (d: NonNullable<ReturnType<typeof getDetail>>) => string[]) =>
    dets.map((d, i) => (d && pick(d).length ? <ul key={tools[i].id} className="list-disc space-y-1 pl-4">{pick(d).map((x) => <li key={x}>{x}</li>)}</ul> : <span key={tools[i].id} className="text-muted">Not recorded</span>));
  const flat = (pick: (d: NonNullable<ReturnType<typeof getDetail>>) => string[]) => dets.map((d) => (d ? pick(d).join("|") : ""));
  const [copied, setCopied] = useState(false);
  const share = async () => {
    try {
      await navigator.clipboard.writeText(`${location.origin}${location.pathname}?ids=${ids.join(",")}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", `${location.origin}${location.pathname}?ids=${ids.join(",")}`);
    }
  };
  const [invalid, setInvalid] = useState<string[]>([]);
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

      {invalid.length > 0 && (
        <p role="alert" className="mt-4 rounded-xl border border-amber/30 bg-amber/10 px-4 py-2 text-sm text-amber">
          The link named {invalid.length === 1 ? "a tool" : "tools"} we do not have ({invalid.join(", ")}), so it was ignored.
        </p>
      )}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" className="chip" onClick={share}>
          {copied ? "Link copied" : "Copy shareable link"}
        </button>
        <span className="text-sm text-muted">Rows marked &ldquo;Differs&rdquo; are where the recorded details are not the same. That is not a ranking.</span>
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
            <Row label="Free trial" cells={tools.map((t) => (t.trial ? "Yes, documented" : <span className="text-muted">Not stated</span>))} />
            <Row
              label="Open source"
              cells={tools.map((t) =>
                t.openSource === "open-source" ? "Open source (verified)" : t.openSource === "source-available" ? "Source-available, not open source" : t.openSource === "open-weights" ? "Open weights" : <span className="text-muted">Not stated</span>,
              )}
            />
            <Row label="Key capability" cells={tools.map((t) => t.keyFeature)} values={tools.map((t) => t.keyFeature)} />
            <Row label="Main features" cells={list((d) => d.features)} values={flat((d) => d.features)} />
            <Row label="Use cases" cells={list((d) => d.useCases)} values={flat((d) => d.useCases)} />
            <Row label="Strengths" cells={list((d) => d.strengths)} values={flat((d) => d.strengths)} />
            <Row label="Limitations" cells={list((d) => d.limitations)} values={flat((d) => d.limitations)} />
            <Row label="Platforms" cells={dets.map((d, i) => (d && d.platforms.length ? d.platforms.join(", ") : <span key={i} className="text-muted">Not recorded</span>))} values={flat((d) => d.platforms)} />
            <Row label="API" cells={dets.map((d, i) => (d?.api ? d.api : <span key={i} className="text-muted">Not stated in our record</span>))} values={dets.map((d) => (d?.api ? "yes" : "no"))} />
            <Row label="Free plan details" cells={dets.map((d, i) => (d?.freeDetails ? d.freeDetails : <span key={i} className="text-muted">None recorded</span>))} />
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
