"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV, SITE } from "@/lib/site";
import { BrandMark } from "@/lib/brand";
import { CODES, CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { useCurrency } from "./CurrencyProvider";

/** One style for every link in the bar, so the header looks identical on every route. */
const LINK =
  "group relative inline-flex h-10 items-center whitespace-nowrap rounded-full border border-transparent px-3 text-[0.95rem] xl:px-3.5 font-semibold no-underline transition-all duration-200 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan";

function NavLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const active = href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href);
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`${LINK} ${active ? "border-violet/70 bg-gradient-to-r from-violet/30 to-electric/25 text-white shadow-[0_0_22px_-6px_rgba(110,90,255,0.9)]" : "text-[#eef0fb] hover:bg-white/5 hover:text-white"}`}>
      {label}
    </Link>
  );
}

function CurrencySelect({ id }: { id: string }) {
  const { currency, setCurrency } = useCurrency();
  return (
    <label className="flex items-center" htmlFor={id}>
      <span className="sr-only">Display currency (estimates only)</span>
      <select
        id={id}
        className="cur"
        value={currency}
        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
        title="Display currency for estimates. Merchants may charge in a different currency."
      >
        {CODES.map((c) => (
          <option key={c} value={c}>
            {CURRENCIES[c].label}
          </option>
        ))}
      </select>
    </label>
  );
}

export default function Header() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  // Mobile sheet: lock page scroll, close on Escape, move focus in and give it back on close.
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("keydown", esc);
    sheet.current?.querySelector<HTMLElement>("a")?.focus();
    return () => {
      html.style.overflow = prev;
      document.removeEventListener("keydown", esc);
    };
  }, [open]);

  return (
    <header className={`sticky top-0 z-50 border-b transition-colors duration-300 ${scrolled || open ? "border-white/10" : "border-transparent"}`}>
      {/* The blur lives on its own layer: a backdrop-filter on the header itself would become the containing block for the fixed mobile sheet and collapse it. */}
      <div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 -z-10 transition-opacity duration-300 ${scrolled || open ? "bg-[#090B18]/85 opacity-100 backdrop-blur-xl" : "opacity-0"}`}
      />
      <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between gap-4 px-5 max-[379px]:gap-2 max-[379px]:px-4">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg font-extrabold tracking-tight text-white no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
        >
          <span className="flex max-[379px]:[&>svg]:h-8 max-[379px]:[&>svg]:w-8">
            <BrandMark size={38} gradientId="brand-header" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="whitespace-nowrap text-[1.15rem] max-[379px]:text-[1rem]">{SITE.name}</span>
            <span className="hidden text-[0.68rem] font-medium tracking-wide text-muted sm:block lg:hidden xl:block">Discover · Compare · Choose</span>
            <span className="sr-only">, home</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          <NavLink href="/" label="Home" pathname={pathname} />
          {NAV.map((n) => (
            <NavLink key={n.href} href={n.href} label={n.label} pathname={pathname} />
          ))}
        </nav>

        <div className="flex items-center gap-2 max-[379px]:gap-1.5">
          <CurrencySelect id="currency-desktop" />
          <Link href="/tools/" aria-label="Search all tools" className="hidden h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-white no-underline transition-colors hover:border-cyan/60 hover:bg-white/10 md:grid">
            <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M14 14l4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>
          </Link>
          <div className="hidden xl:block">
            <Link href="/tools/" className="btn-primary btn-sm">
              Explore Tools <span aria-hidden="true">→</span>
            </Link>
          </div>
          <button
            ref={toggle}
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan max-[379px]:h-10 max-[379px]:w-10 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              {open ? (
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              ) : (
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

              {open && (
          <div
            id="mobile-nav"
            ref={sheet}
            className="sheet-in fixed inset-x-0 top-[68px] bottom-0 z-40 overflow-y-auto border-t border-white/10 bg-[#090B18]/97 backdrop-blur-xl lg:hidden"
          >
            <nav aria-label="Mobile" className="mx-auto flex max-w-7xl flex-col px-5 py-4">
              {[{ href: "/", label: "Home" }, ...NAV].map((n) => {
                const active = n.href === "/" ? pathname === "/" : pathname.startsWith(n.href);
                return (
                  <Link
                    key={n.href}
                    href={n.href}
                    aria-current={active ? "page" : undefined}
                    className={`flex min-h-12 items-center justify-between border-b border-white/5 px-1 text-lg font-semibold no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan ${
                      active ? "text-white" : "text-soft"
                    }`}
                  >
                    {n.label}
                    {active && <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-cyan" />}
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      
    </header>
  );
}
