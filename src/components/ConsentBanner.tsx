"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ANALYTICS_ENABLED, CONSENT_OPEN, loadGa, privacySignal, readConsent, setConsent, type Consent } from "@/lib/analytics";

/** Asks once whether anonymous visit statistics are allowed. Renders nothing at all unless analytics is configured for this build. */
export default function ConsentBanner() {
  const [choice, setChoice] = useState<Consent | "pending">("pending");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!ANALYTICS_ENABLED) return;
    const c = readConsent();
    setChoice(c);
    if (c === "granted") loadGa();
    const reopen = () => setOpen(true);
    window.addEventListener(CONSENT_OPEN, reopen);
    return () => window.removeEventListener(CONSENT_OPEN, reopen);
  }, []);

  if (!ANALYTICS_ENABLED || choice === "pending" || (choice !== null && !open)) return null;

  const decide = (v: "granted" | "denied") => {
    setConsent(v);
    setChoice(v);
    setOpen(false);
  };

  return (
    <div role="dialog" aria-label="Analytics choice" className="glass fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-xl rounded-2xl p-4 shadow-2xl sm:bottom-5">
      <p className="text-sm text-soft">
        May we count visits with Google Analytics? It shows us which pages help, with no ads and no sign-in. It stays off unless you say yes, and you can change this any time from the footer.{" "}
        <Link href="/privacy/" className="underline">
          Privacy policy
        </Link>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className="btn-ghost btn-sm" onClick={() => decide("granted")}>
          Allow analytics
        </button>
        <button type="button" className="btn-ghost btn-sm" onClick={() => decide("denied")}>
          No thanks
        </button>
      </div>
    </div>
  );
}

/** Footer button that reopens the choice. Hidden when analytics is off for this build or the browser already says "do not track". */
export function ConsentLink() {
  const [show, setShow] = useState(false);
  useEffect(() => setShow(ANALYTICS_ENABLED && !privacySignal()), []);
  if (!show) return null;
  return (
    <button type="button" className="text-soft underline hover:text-white" onClick={() => window.dispatchEvent(new Event(CONSENT_OPEN))}>
      Analytics settings
    </button>
  );
}
