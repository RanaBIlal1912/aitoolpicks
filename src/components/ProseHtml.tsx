"use client";

import { useEffect, useRef } from "react";
import { resolveAffiliate } from "@/lib/affiliate";
import { convert, format } from "@/lib/currency";
import { PRICES, PRICES_AS_OF } from "@/lib/prices";
import { getTool } from "@/data/tools";
import { useCurrency } from "./CurrencyProvider";

/**
 * Renders the article HTML ported from the original site (it is in the static page for SEO), then upgrades
 * its `data-aff` buttons and `data-price` lines with the same logic as the rest of the site.
 */
export default function ProseHtml({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const { currency, rates, meta, country } = useCurrency();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    root.querySelectorAll<HTMLAnchorElement>("a[data-aff]").forEach((a) => {
      const id = a.dataset.aff ?? "";
      const tool = getTool(id);
      const aff = resolveAffiliate(id, country);
      const url = aff ?? tool?.officialUrl;
      if (!url) return;
      a.href = url;
      a.target = "_blank";
      a.rel = aff ? "sponsored nofollow noopener noreferrer" : "noopener noreferrer";
      a.title = aff ? "Affiliate link" : "Official site";
    });

    root.querySelectorAll<HTMLElement>("[data-price]").forEach((el) => {
      const p = PRICES[el.dataset.price ?? ""];
      if (!p) {
        el.hidden = true;
        return;
      }
      const merchant = `${format(p.usd, "USD")} / ${p.per} (${p.note})`;
      const est =
        currency === "USD"
          ? "Shown in US dollars."
          : `Estimate in ${currency}: ≈ ${format(convert(p.usd, currency, rates), currency)}${meta.live ? ` (rates of ${meta.date})` : " (approximate rate)"}.`;
      el.textContent = `Merchant price: ${merchant}, checked ${PRICES_AS_OF}. ${est} Check the official site for current pricing.`;
      el.hidden = false;
    });
  }, [currency, rates, meta, country, html]);

  return <div ref={ref} className="prose-article" dangerouslySetInnerHTML={{ __html: html }} />;
}
