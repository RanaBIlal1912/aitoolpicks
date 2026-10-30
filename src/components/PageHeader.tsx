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

export default function PageHeader({
  eyebrow,
  title,
  lead,
  crumbs,
  children,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  crumbs?: Crumb[];
  children?: ReactNode;
}) {
  return (
    <header className="page-head relative mx-auto max-w-6xl px-5 pb-10 pt-14 md:pt-20">
      {crumbs && <Breadcrumbs items={crumbs} />}
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h1 className="mt-4 max-w-3xl text-[clamp(2.1rem,5vw,3.6rem)] font-extrabold leading-[1.05] tracking-[-0.035em] text-white">{title}</h1>
      {lead && <p className="mt-5 max-w-2xl text-lg text-soft">{lead}</p>}
      {children}
    </header>
  );
}
