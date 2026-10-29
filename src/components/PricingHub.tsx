"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORIES, PRICING_MODEL_LABEL, TOOLS } from "@/data/tools";
import { formatChecked } from "@/lib/dates";

const STATUS = { verified: "Verified", partial: "Partly verified", unverified: "Not verified" } as const;
const STATUS_CLS = { verified: "text-emerald-300", partial: "text-amber", unverified: "text-muted" } as const;

export default function PricingHub() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [status, setStatus] = useState<"all" | "verified" | "partial" | "unverified">("all");
  const [sort, setSort] = useState<"name" | "price">("name");

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase();
    const list = TOOLS.filter(
      (t) =>
        (cat === "all" || t.categories.includes(cat)) &&
        (status === "all" || t.pricingStatus === status) &&
        (!n || `${t.name} ${t.vendor}`.toLowerCase().includes(n)),
    );
    return [...list].sort((a, b) => (sort === "price" ? (a.fromUsd ?? 1e9) - (b.fromUsd ?? 1e9) : 0) || a.name.localeCompare(b.name));
  }, [q, cat, status, sort]);

  return (
    <section aria-labelledby="pricing-title" className="mx-auto max-w-6xl px-5">
      <h2 id="pricing-title" className="sr-only">
        Pricing table
      </h2>
      <div className="glass rounded-[24px] p-4 md:p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="md:col-span-1">
            <label htmlFor="ph-q" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-muted">
              Search
            </label>
            <input id="ph-q" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tool or vendor" className="h-11 w-full rounded-2xl border border-white/12 bg-black/30 px-4 text-white placeholder:text-muted focus:border-brand focus:outline-none" />
          </div>
          <div>
            <label htmlFor="ph-c" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-muted">
              Category
            </label>
            <select id="ph-c" className="cur !w-full" value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.short}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="ph-s" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-muted">
              Pricing status
            </label>
            <select id="ph-s" className="cur !w-full" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="partial">Partly verified</option>
              <option value="unverified">Not verified</option>
            </select>
          </div>
          <div>
            <label htmlFor="ph-o" className="mb-1.5 block text-xs font-bold uppercase tracking-[0.12em] text-muted">
              Sort
            </label>
            <select id="ph-o" className="cur !w-full" value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
              <option value="name">Name (A to Z)</option>
              <option value="price">Lowest starting price (USD)</option>
            </select>
          </div>
        </div>
      </div>

      <p className="mt-5 text-sm text-muted" role="status" aria-live="polite">
        {rows.length} of {TOOLS.length} tools
      </p>

      <div className="table-wrap glass mt-3">
        <table className="cmp">
          <caption className="sr-only">Pricing for AI tools, in each merchant&rsquo;s own currency</caption>
          <thead>
            <tr>
              <th scope="col">Tool</th>
              <th scope="col">Free access</th>
              <th scope="col">Plans and prices (merchant currency)</th>
              <th scope="col">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <th scope="row" className="!w-[22%]">
                  <Link href={`/tools/${t.id}/`} className="font-bold text-white no-underline hover:underline">
                    {t.name}
                  </Link>
                  <span className="mt-0.5 block text-xs font-normal text-muted">{PRICING_MODEL_LABEL[t.pricingModel]}</span>
                </th>
                <td>{t.freePlan === true ? "Yes" : t.freePlan === false ? "No" : <span className="text-muted">Not stated</span>}</td>
                <td>
                  {t.plans.length ? (
                    <ul className="space-y-0.5 text-sm">
                      {t.plans.slice(0, 4).map((p) => (
                        <li key={p.name}>
                          <span className="text-muted">{p.name}:</span> {p.price}
                        </li>
                      ))}
                      {t.plans.length > 4 && <li className="text-muted">+ {t.plans.length - 4} more</li>}
                    </ul>
                  ) : (
                    <span className="text-muted">Not captured</span>
                  )}
                </td>
                <td className="text-sm">
                  <span className={`font-semibold ${STATUS_CLS[t.pricingStatus]}`}>{STATUS[t.pricingStatus]}</span>
                  <span className="block text-xs text-muted">checked {formatChecked(t.checked)}</span>
                  <a href={t.pricingSource} target="_blank" rel="noopener noreferrer" className="text-xs text-[#9db4d6] underline">
                    Official pricing ↗
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-muted">
        Prices are copied as the merchant lists them, in the merchant&rsquo;s currency, without conversion. Open any tool page to see an estimate in your selected
        currency, clearly separated from the official price.
      </p>
    </section>
  );
}
