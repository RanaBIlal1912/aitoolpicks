"use client";

import type { ReactNode } from "react";
import { affiliateStatus, resolveAffiliate } from "@/lib/affiliate";
import { track } from "@/lib/analytics";
import links from "@/data/generated/tool-links.json";
import { useCurrency } from "./CurrencyProvider";

/**
 * Button that points to our affiliate link when one is configured, otherwise to the tool's official site.
 * The affiliate link depends on the visitor's country only. It never changes when the currency changes.
 */
export default function AffLink({
  id,
  children,
  className = "btn-primary btn-sm",
  placement,
}: {
  id: string;
  children?: ReactNode;
  className?: string;
  /** Where on the page the button sits, recorded with the click. */
  placement?: string;
}) {
  const { country } = useCurrency();
  const entry = (links as unknown as Record<string, [string, string]>)[id];
  if (!entry) return null;
  const [name, officialUrl] = entry;
  const aff = resolveAffiliate(id, country);
  const status = affiliateStatus(id);
  const clicked = () => track("outbound_click", { tool: id, kind: aff ? "affiliate" : "official", status, placement });
  const label = children ?? (aff ? `Try ${name}` : `Visit ${name}`);
  return (
    <a
      className={className}
      href={aff ?? officialUrl}
      target="_blank"
      rel={aff ? "sponsored nofollow noopener noreferrer" : "noopener noreferrer"}
      data-affiliate={aff ? "true" : "false"}
      data-affiliate-status={status}
      data-cta="outbound"
      data-tool={id}
      onClick={clicked}
      onAuxClick={clicked}
    >
      {label}
      {children ? <span className="sr-only"> for {name}</span> : null}
      <span className="sr-only"> (opens in a new tab{aff ? ", affiliate link" : ""})</span>
    </a>
  );
}
