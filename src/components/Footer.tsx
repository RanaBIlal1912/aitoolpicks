import Link from "next/link";
import { FOOTER_LINKS, NAV, SITE } from "@/lib/site";
import RateNote from "./RateNote";
import { BrandMark } from "@/lib/brand";
import { CATEGORIES, TOOLS } from "@/data/tools";

export default function Footer() {
  return (
    <footer className="cv-foot mt-24 border-t border-white/10 bg-black/20">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-14 md:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <p className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-white">
            <BrandMark size={28} gradientId="brand-footer" />
            {SITE.name}
          </p>
          <p className="mt-3 max-w-sm text-[0.95rem] text-muted">
            {SITE.tagline}. We say who each tool is good for, and who should skip it.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <span className="chip">{TOOLS.length} tools</span>
            <span className="chip">{CATEGORIES.length} categories</span>
            <a href={SITE.repo} target="_blank" rel="noopener noreferrer" className="chip no-underline">
              GitHub ↗
            </a>
          </div>
          <p className="mt-4 max-w-sm text-sm text-muted">
            Some links are affiliate links. We may earn a commission at no extra cost to you.{" "}
            <Link prefetch={false} href="/affiliate-disclosure/" className="text-soft underline">
              Read the disclosure
            </Link>
            .
          </p>
        </div>
        <nav aria-label="Categories">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Categories</p>
          <ul className="mt-4 space-y-2">
            {CATEGORIES.slice(0, 8).map((c) => (
              <li key={c.slug}>
                <Link prefetch={false} href={`/tools/category/${c.slug}/`} className="text-soft no-underline hover:text-white">
                  {c.short}
                </Link>
              </li>
            ))}
            <li>
              <Link prefetch={false} href="/tools/" className="font-semibold text-cyan no-underline hover:text-white">
                All {CATEGORIES.length} categories →
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Explore">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Explore</p>
          <ul className="mt-4 space-y-2">
            {[...NAV, { href: "/best/", label: "Best-of guides", feature: false }].map((n) => (
              <li key={n.href}>
                <Link prefetch={false} href={n.href} className="text-soft no-underline hover:text-white">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Company and legal">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Company</p>
          <ul className="mt-4 space-y-2">
            {FOOTER_LINKS.map((n) => (
              <li key={n.href}>
                <Link prefetch={false} href={n.href} className="text-soft no-underline hover:text-white">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-7xl space-y-2 px-5 py-6 text-sm text-muted">
          <RateNote />
          <p>
            &copy; {new Date().getFullYear()} {SITE.name}. Product names belong to their owners; we are not affiliated with
            the tools we cover unless we say so. Prices and features change, so check each official site before you pay.
          </p>
        </div>
      </div>
    </footer>
  );
}
