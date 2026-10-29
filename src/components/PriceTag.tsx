"use client";

import { PRICES, PRICES_AS_OF } from "@/lib/prices";
import { convert, format } from "@/lib/currency";
import { useCurrency } from "./CurrencyProvider";

/**
 * Shows the real merchant price (USD) and, separately, a clearly labelled estimate in the visitor's currency.
 */
export default function PriceTag({ id, compact = false }: { id: string; compact?: boolean }) {
  const { currency, rates, meta } = useCurrency();
  const p = PRICES[id];
  if (!p) return <span className="text-muted">See the official site for current pricing</span>;

  const merchant = `${format(p.usd, "USD")} / ${p.per}`;
  const est = currency === "USD" ? null : format(convert(p.usd, currency, rates), currency);

  if (compact) {
    return (
      <span>
        <b className="text-white">{merchant}</b>
        {est && (
          <span className="text-muted">
            {" "}
            (est. ≈ {est})
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="price-chip">
      <b>{merchant}</b> · {p.note}
      <small>
        Merchant price in USD, checked {PRICES_AS_OF}.{" "}
        {est ? (
          <>
            Estimate in {currency}: ≈ {est}
            {meta.live ? ` (rates of ${meta.date})` : " (approximate rate)"}.
          </>
        ) : (
          "Prices are shown in US dollars."
        )}{" "}
        <a href={p.source} target="_blank" rel="noopener noreferrer" className="underline">
          Verify on official page
        </a>
      </small>
    </span>
  );
}
