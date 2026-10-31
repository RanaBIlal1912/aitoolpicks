import Link from "next/link";
import { FOOTER_LINKS, NAV, SITE } from "@/lib/site";
import RateNote from "./RateNote";
import { BrandMark } from "@/lib/brand";

export default function Footer() {
  return (
    <footer className="cv-foot mt-24 border-t border-white/10 bg-black/20">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-white">
            <BrandMark size={28} gradientId="brand-footer" />
            {SITE.name}
          </p>
          <p className="mt-3 max-w-sm text-[0.95rem] text-muted">
            {SITE.tagline}. We say who each tool is good for, and who should skip it.
          </p>
          <p className="mt-4 max-w-sm text-sm text-muted">
            Some links are affiliate links. We may earn a commission at no extra cost to you.{" "}
            <Link href="/affiliate-disclosure/" className="text-soft underline">
              Read the disclosure
            </Link>
            .
          </p>
        </div>
        <nav aria-label="Explore">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted">Explore</p>
          <ul className="mt-4 space-y-2">
            {[...NAV, { href: "/best/", label: "Best-of guides", feature: false }].map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="text-soft no-underline hover:text-white">
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
                <Link href={n.href} className="text-soft no-underline hover:text-white">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto max-w-6xl space-y-2 px-5 py-6 text-sm text-muted">
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
