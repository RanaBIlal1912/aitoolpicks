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
  aside,
  tint,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  crumbs?: Crumb[];
  children?: ReactNode;
  variant?: HeaderVariant;
  stats?: [string, string][];
  accent?: string;
  aside?: ReactNode;
  /** Two hex colours that replace the banner glow (used by category pages so each has its own colour identity). */
  tint?: [string, string];
}) {
  const rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(", ");
  return (
    <header className={`page-head ph-${variant} relative mx-auto max-w-7xl px-5 pb-8 pt-10 md:pt-14`} style={{ ...(accent ? { ["--accent"]: accent } : {}), ...(tint ? { ["--ph-a"]: rgb(tint[0]), ["--ph-b"]: rgb(tint[1]) } : {}) } as React.CSSProperties}>
      {crumbs && <Breadcrumbs items={crumbs} />}
      <div className="hero-banner relative overflow-hidden rounded-[30px] px-6 py-9 md:px-12 md:py-12">
        <span aria-hidden="true" className="hb-orb" />
        <span aria-hidden="true" className="hb-ring" />
        <div className="relative max-w-3xl">
          {eyebrow && <span className="eyebrow">{eyebrow}</span>}
          <h1 className="mt-4 text-[clamp(2.1rem,4.6vw,3.7rem)] font-extrabold leading-[1.05] tracking-[-0.03em] text-white">{title}</h1>
          {lead && <p className="mt-5 max-w-2xl text-lg text-soft">{lead}</p>}
        </div>
        {stats && (
          <dl className="ph-stats relative mt-8 flex flex-wrap gap-3">
            {stats.map(([n, l]) => (
              <div key={l} className="ph-stat">
                <dd className="font-display text-2xl font-extrabold leading-none tracking-tight">{n}</dd>
                <dt className="mt-1 text-[0.7rem] font-semibold uppercase tracking-[0.12em] text-muted">{l}</dt>
              </div>
            ))}
          </dl>
        )}
        {children && <div className="relative">{children}</div>}
        {aside && (
          <div aria-hidden="true" className="ph-aside pointer-events-none absolute right-8 top-1/2 hidden -translate-y-1/2 md:grid">
            {aside}
          </div>
        )}
      </div>
    </header>
  );
}
