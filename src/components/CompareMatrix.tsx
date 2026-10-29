"use client";

import Link from "next/link";
import { useState } from "react";
import { TOOLS, getTool, type Tool } from "@/data/tools";
import { PRICES } from "@/lib/prices";
import AffLink from "./AffLink";
import PriceTag from "./PriceTag";

function ToolSelect({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-muted">
        {label}
      </label>
      <select id={id} className="cur !w-full" value={value} onChange={(e) => onChange(e.target.value)}>
        {TOOLS.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function Row({ label, a, b }: { label: string; a: React.ReactNode; b: React.ReactNode }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{a}</td>
      <td>{b}</td>
    </tr>
  );
}

const price = (t: Tool) => (PRICES[t.id] ? <PriceTag id={t.id} compact /> : <span className="text-muted">See the official site</span>);
const free = (t: Tool) => (t.freePlan ? "Yes, a free plan is available" : <span className="text-muted">Check the official site</span>);
const review = (t: Tool) => (
  <span className="flex flex-col gap-1">
    <Link href={`/tools/${t.id}/`} className="text-[#8fd3ff] underline">
      Tool page
    </Link>
    {t.review && (
      <Link href={`/reviews/${t.review}/`} className="text-[#8fd3ff] underline">
        Our overview
      </Link>
    )}
  </span>
);

export default function CompareMatrix() {
  const [aId, setA] = useState("chatgpt");
  const [bId, setB] = useState("grammarly");
  const a = getTool(aId) ?? TOOLS[0];
  const b = getTool(bId) ?? TOOLS[1];

  return (
    <div className="glass rounded-[26px] p-5 md:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <ToolSelect id="cmp-a" label="Tool A" value={aId} onChange={setA} />
        <ToolSelect id="cmp-b" label="Tool B" value={bId} onChange={setB} />
      </div>

      {aId === bId && (
        <p role="status" className="mt-4 rounded-xl border border-amber/30 bg-amber/10 px-4 py-2 text-sm text-amber">
          You picked the same tool twice. Choose a different Tool B to compare.
        </p>
      )}

      <div className="table-wrap mt-6 border border-white/10">
        <table className="cmp">
          <caption className="sr-only">
            Comparison of {a.name} and {b.name}
          </caption>
          <thead>
            <tr>
              <th scope="col">&nbsp;</th>
              <th scope="col">{a.name}</th>
              <th scope="col">{b.name}</th>
            </tr>
          </thead>
          <tbody>
            <Row label="Category" a={a.category} b={b.category} />
            <Row label="What it is" a={a.tagline} b={b.tagline} />
            <Row label="Best for" a={a.bestFor} b={b.bestFor} />
            <Row label="Free plan" a={free(a)} b={free(b)} />
            <Row label="Paid plan (USD)" a={price(a)} b={price(b)} />
            <Row label="Read more" a={review(a)} b={review(b)} />
            <Row
              label="Try it"
              a={<AffLink id={a.id} />}
              b={<AffLink id={b.id} />}
            />
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-muted">
        Prices are shown only where we checked the official page. Other tools say &ldquo;See the official site&rdquo; instead of a guess.
      </p>
    </div>
  );
}
