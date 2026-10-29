"use client";

import type { ReactNode } from "react";
import { resolveAffiliate } from "@/lib/affiliate";
import { getTool } from "@/data/tools";
import { useCurrency } from "./CurrencyProvider";

/**
 * Button that points to our affiliate link when one is configured, otherwise to the tool's official site.
 * The affiliate link depends on the visitor's country only. It never changes when the currency changes.
 */
export default function AffLink({
  id,
  children,
  className = "btn-primary btn-sm",
}: {
  id: string;
  children?: ReactNode;
  className?: string;
}) {
  const { country } = useCurrency();
  const tool = getTool(id);
  if (!tool) return null;
  const aff = resolveAffiliate(id, country);
  const label = children ?? (aff ? `Try ${tool.name}` : `Visit ${tool.name}`);
  return (
    <a
      className={className}
      href={aff ?? tool.officialUrl}
      target="_blank"
      rel={aff ? "sponsored nofollow noopener noreferrer" : "noopener noreferrer"}
      data-affiliate={aff ? "true" : "false"}
    >
      {label}
      <span className="sr-only"> (opens in a new tab{aff ? ", affiliate link" : ""})</span>
    </a>
  );
}
