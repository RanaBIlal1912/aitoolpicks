"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MORE, NAV, SITE } from "@/lib/site";
import { BrandMark } from "@/lib/brand";
import { CODES, CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { useCurrency } from "./CurrencyProvider";

/** One style for every link in the bar, so the header looks identical on every route. */
const LINK =
  "group relative inline-flex h-10 items-center rounded-lg px-3 text-[0.95rem] font-medium no-underline transition-colors duration-200 " +
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan";

function Underline({ active }: { active: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-3 bottom-1 h-px origin-left bg-current transition-transform duration-300 ease-out ${
        active ? "scale-x-100" : "scale-x-0 group-hover:scale-x-100 group-focus-visible:scale-x-100"
      }`}
    />
  );
}

function NavLink({ href, label, pathname }: { href: string; label: string; pathname: string }) {
  const active = pathname === href || pathname.startsWith(href);
  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={`${LINK} ${active ? "text-white" : "text-soft hover:text-white"}`}>
      {label}
      <Underline active={active} />
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

function MoreMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => {
      document.removeEventListener("mousedown", away);
      document.removeEventListener("keydown", esc);
    };
  }, [open]);
  const active = MORE.some((m) => pathname.startsWith(m.href));
  return (
    <div ref={wrap} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls="more-menu"
        onClick={() => setOpen((v) => !v)}
        className={`${LINK} gap-1.5 ${active || open ? "text-white" : "text-soft hover:text-white"}`}
      >
        More
        <svg width="10" height="6" viewBox="0 0 12 8" aria-hidden="true" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
          <path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
        <Underline active={active || open} />
      </button>
      {open && (
        <ul id="more-menu" className="glass absolute right-0 top-full z-50 mt-2 w-56 rounded-xl p-1.5 shadow-2xl">
          {MORE.map((m) => (
            <li key={m.href}>
              <Link
                href={m.href}
                aria-current={pathname.startsWith(m.href) ? "page" : undefined}
                className="block rounded-lg px-3.5 py-2.5 text-soft no-underline transition-colors hover:bg-white/10 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan aria-[current=page]:text-white"
              >
                {m.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
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
        className={`pointer-events-none absolute inset-0 -z-10 transition-opacity duration-300 ${scrolled || open ? "bg-[#05070d]/85 opacity-100 backdrop-blur-xl" : "opacity-0"}`}
      />
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 px-5">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg font-extrabold tracking-tight text-white no-underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan"
          aria-label={`${SITE.name} home`}
        >
          <BrandMark size={32} gradientId="brand-header" />
          <span className="text-[1.08rem]">{SITE.name}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-0.5 lg:flex">
          {NAV.map((n) => (
            <NavLink key={n.href} href={n.href} label={n.label} pathname={pathname} />
          ))}
          <MoreMenu pathname={pathname} />
        </nav>

        <div className="flex items-center gap-2">
          <CurrencySelect id="currency-desktop" />
          <button
            ref={toggle}
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan lg:hidden"
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

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-nav"
            ref={sheet}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-0 top-[68px] bottom-0 z-40 overflow-y-auto border-t border-white/10 bg-[#05070d]/97 backdrop-blur-xl lg:hidden"
          >
            <nav aria-label="Mobile" className="mx-auto flex max-w-6xl flex-col px-5 py-4">
              {[...NAV, ...MORE].map((n) => {
                const active = pathname.startsWith(n.href);
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
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
