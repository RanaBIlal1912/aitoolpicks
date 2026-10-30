"use client";

import { PRICES, PRICES_AS_OF } from "@/lib/prices";
import { convertBetween, format } from "@/lib/currency";
import { useCurrency } from "./CurrencyProvider";

/**
 * Headline reference price for a tool: the official price in the merchant's own currency, with a separate,
 * clearly labelled estimate in the visitor's display currency. Shows nothing invented when we have no verified price.
 */
export default function PriceTag({ id, compact = false }: { id: string; compact?: boolean }) {
  const { currency, rates, meta } = useCurrency();
  const p = PRICES[id];
  if (!p) return <span className="text-muted">No single headline price recorded. See the plans on the tool page or the official pricing page.</span>;

  const official = `${format(p.amount, p.currency)} per ${p.per}`;
  const est = currency === p.currency ? null : format(convertBetween(p.amount, p.currency, currency, rates), currency);

  if (compact) {
    return (
      <span>
        <b className="text-white">{official}</b>
        {est && <span className="text-muted"> (est. ≈ {est})</span>}
      </span>
    );
  }

  return (
    <span className="price-chip">
      <b>{official}</b> · {p.plan}
      <small>
        Official price in {p.currency} ({p.billing}), checked {PRICES_AS_OF}.{" "}
        {est ? (
          <>
            Estimate in {currency}: ≈ {est}
            {meta.live ? ` (rates of ${meta.date})` : " (approximate rate)"}. The merchant charges in {p.currency}.
          </>
        ) : (
          "Shown in the merchant's own currency."
        )}{" "}
        <a href={p.source} target="_blank" rel="noopener noreferrer" className="underline">
          Official pricing page
        </a>
      </small>
    </span>
  );
}
