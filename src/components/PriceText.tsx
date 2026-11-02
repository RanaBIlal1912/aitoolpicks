"use client";

import { estimateText } from "@/lib/price-text";
import { useCurrency } from "./CurrencyProvider";

/**
 * A vendor price exactly as the vendor states it, plus an estimate in the visitor's chosen currency when one can be made honestly.
 * Reads the shared currency, so every price on every page changes together. With no real exchange rates, or text without an amount
 * ("Free", "Custom pricing"), only the original text is shown.
 */
export default function PriceText({ text }: { text: string }) {
  const { currency, liveRates } = useCurrency();
  const est = estimateText(text, currency, liveRates);
  return (
    <>
      {text}
      {est && (
        <span className="text-muted" title={`Estimate in ${currency}. The vendor charges as shown above.`}>
          {" "}
          ≈ {est}
        </span>
      )}
    </>
  );
}
