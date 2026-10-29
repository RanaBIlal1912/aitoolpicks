"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MORE, NAV, SITE } from "@/lib/site";
import { CODES, CURRENCIES, type CurrencyCode } from "@/lib/currency";
import { useCurrency } from "./CurrencyProvider";

function CurrencySelect({ id }: { id: string }) {
  const { currency, setCurrency } = useCurrency();
  return (
    <label className="flex items-center" htmlFor={id}>
      <span className="sr-only">Display currency</span>
      <select
        id={id}
        className="cur"
        value={currency}
        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
        aria-label="Display currency (estimates only)"
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

function LogoMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2f7bff" />
          <stop offset="1" stopColor="#9d6bff" />
        </linearGradient>
      </defs>
      <rect x="1" y="1" width="32" height="32" rx="10" fill="url(#lg)" />
      <path d="M17 7l8.5 5v10L17 27l-8.5-5V12z" fill="none" stroke="#fff" strokeOpacity=".9" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="17" cy="17" r="2.6" fill="#fff" />
    </svg>
  );
}

function MoreMenu({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => {
      if (wrap.current && !wrap.current.contains(e.target as Node)) setOpen(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
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
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.95rem] font-medium transition-colors ${active || open ? "bg-white/10 text-white" : "text-soft hover:bg-white/5 hover:text-white"}`}
      >
        More
        <svg width="10" height="6" viewBox="0 0 12 8" aria-hidden="true" className={`transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M1 1l5 5 5-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
      {open && (
        <ul className="glass absolute right-0 top-full z-50 mt-2 w-56 rounded-2xl p-2 shadow-2xl" role="menu">
          {MORE.map((m) => (
            <li key={m.href} role="none">
              <Link href={m.href} role="menuitem" className="block rounded-xl px-4 py-2.5 text-soft no-underline hover:bg-white/10 hover:text-white">
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

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled || open ? "border-b border-white/10 bg-[#05060f]/80 backdrop-blur-xl" : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex items-center gap-2.5 font-extrabold tracking-tight text-white no-underline" aria-label={`${SITE.name} home`}>
          <LogoMark />
          <span className="text-[1.08rem]">{SITE.name}</span>
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => {
            const active = pathname.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-full px-3.5 py-1.5 text-[0.95rem] font-medium no-underline transition-colors ${
                  active ? "bg-white/10 text-white" : "text-soft hover:bg-white/5 hover:text-white"
                } ${n.feature && !active ? "ring-1 ring-inset ring-violet/35" : ""}`}
              >
                {n.feature && <span aria-hidden="true" className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-cyan align-middle shadow-[0_0_8px_#22d3ee]" />}
                {n.label}
              </Link>
            );
          })}
          <MoreMenu pathname={pathname} />
        </nav>

        <div className="flex items-center gap-2">
          <CurrencySelect id="currency-desktop" />
          <button
            type="button"
            className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/5 text-white lg:hidden"
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
          <motion.nav
            id="mobile-nav"
            aria-label="Mobile"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden lg:hidden"
          >
            <div className="mx-auto flex max-w-6xl flex-col gap-1 px-5 pb-5">
              {[...NAV, ...MORE].map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  className="rounded-xl px-4 py-3 text-lg font-semibold text-white no-underline hover:bg-white/10"
                >
                  {n.label}
                </Link>
              ))}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
