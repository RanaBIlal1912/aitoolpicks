"use client";

import { useCurrency } from "./CurrencyProvider";
import { CURRENCIES } from "@/lib/currency";

export default function RateNote() {
  const { currency, meta } = useCurrency();
  return (
    <p aria-live="polite">
      {currency === "USD" ? (
        "Merchant prices are in US dollars, our base currency. Pick another currency in the header to see an estimate."
      ) : meta.live ? (
        <>
          {CURRENCIES[currency].label} amounts are <strong className="text-soft">estimates</strong> converted from USD using
          rates of {meta.date} ({meta.source}). Your checkout price may differ.{" "}
          {meta.credit && (
            <a href={meta.credit} target="_blank" rel="noopener noreferrer" className="underline">
              Rates by Exchange Rate API
            </a>
          )}
        </>
      ) : (
        <>
          Live exchange rates were unavailable, so {CURRENCIES[currency].label} amounts are{" "}
          <strong className="text-soft">approximate estimates</strong> from USD (rates of {meta.date}). Your checkout price may
          differ.
        </>
      )}
    </p>
  );
}
