import Link from "next/link";
import type { ReactNode } from "react";
import { absUrl } from "@/lib/site";
import JsonLd from "./JsonLd";

export type Crumb = { name: string; href: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const all: Crumb[] = [{ name: "Home", href: "/" }, ...items];
  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted">
        <ol className="flex flex-wrap items-center gap-2">
          {all.map((c, i) => (
            <li key={c.href} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i === all.length - 1 ? (
                <span aria-current="page" className="text-soft">
                  {c.name}
                </span>
              ) : (
                <Link href={c.href} className="no-underline hover:text-white">
                  {c.name}
                </Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: all.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: absUrl(c.href) })),
        }}
      />
    </>
  );
}

export type HeaderVariant = "default" | "magazine" | "lab" | "directory" | "studio";

/** Each variant is a different composition, not a different colour: a masthead for reading pages, an instrument panel for data pages, a search-first header for the directory. */
export default function PageHeader({
  eyebrow,
  title,
  lead,
  crumbs,
  children,
  variant = "default",
  stats,
  accent,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  crumbs?: Crumb[];
  children?: ReactNode;
  variant?: HeaderVariant;
  stats?: [string, string][];
  accent?: string;
}) {
  return (
    <header className={`page-head ph-${variant} relative mx-auto max-w-6xl px-5 pb-10 pt-14 md:pt-20`} style={accent ? ({ ["--accent"]: accent } as React.CSSProperties) : undefined}>
      {crumbs && <Breadcrumbs items={crumbs} />}
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1 className="mt-4 max-w-3xl text-[clamp(2.1rem,5vw,3.6rem)] font-extrabold leading-[1.05] tracking-[-0.035em] text-white">{title}</h1>
      {lead && <p className="mt-5 max-w-2xl text-lg text-soft">{lead}</p>}
      {stats && (
        <dl className="ph-stats mt-8 flex flex-wrap gap-x-10 gap-y-4">
          {stats.map(([n, l]) => (
            <div key={l}>
              <dd className="font-display text-3xl font-extrabold tracking-tight text-white">{n}</dd>
              <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">{l}</dt>
            </div>
          ))}
        </dl>
      )}
      {children}
    </header>
  );
}
