// Google Analytics 4, behind the visitor's consent.
//
// Off unless NEXT_PUBLIC_GA_ID is set at build time (the deploy workflow does not set it until the owner approves). Even when it is set, nothing is loaded and
// nothing is sent until the visitor presses "Allow analytics"; "No thanks", or a browser Global Privacy Control / Do Not Track signal, keeps it off.
// Ads features are switched off (no Google signals, no ad personalisation). The /privacy/ page describes this and changes with ANALYTICS_ENABLED.
import { SITE } from "@/lib/site";

const RAW_ID = (process.env.NEXT_PUBLIC_GA_ID ?? "").trim();
/**
 * Four things must all be true, so analytics cannot go live by accident: a valid measurement ID, the operator's name and a private privacy contact (both set by the owner,
 * and shown on /privacy/), and the owner's explicit sign-off (NEXT_PUBLIC_ANALYTICS_APPROVED=yes) after the legal and account decisions in docs/LAUNCH_CHECKLIST.md.
 */
export const ANALYTICS_ENABLED = /^G-[A-Z0-9]{6,}$/.test(RAW_ID) && SITE.operatorName !== "" && SITE.privacyContact !== "" && (process.env.NEXT_PUBLIC_ANALYTICS_APPROVED ?? "").trim() === "yes";
/** Everything below uses this, which is empty unless analytics is fully enabled. (A build given the ID alone still contains the ID text, but nothing reads it.) */
export const GA_ID = ANALYTICS_ENABLED ? RAW_ID : "";

export type Consent = "granted" | "denied" | null;
export type CtaEvent = { tool: string; kind: "official" | "affiliate"; placement?: string };

const KEY = "aitp-consent";
/** A choice is asked for again after 13 months. */
const CHOICE_TTL_MS = 395 * 24 * 3600 * 1000;
export const CONSENT_OPEN = "aitp-consent-open";

type Gtag = (...args: unknown[]) => void;
type GaWindow = { dataLayer?: unknown[]; gtag?: Gtag } & Record<string, unknown>;
const gw = () => window as unknown as GaWindow;

/**
 * GitHub Pages project sites all share one origin (ranabilal1912.github.io), so Google's cookies are kept to this site's own path
 * and only that path is ever cleared. On a custom domain at the root this is "/".
 */
const cookiePath = () => SITE.basePath || "/";

let granted = false;
let lastSent = "";

/** True when the browser itself asks not to be tracked (Global Privacy Control or Do Not Track). */
export function privacySignal(): boolean {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean };
  return n.globalPrivacyControl === true || n.doNotTrack === "1";
}

export function readConsent(now = Date.now()): Consent {
  if (privacySignal()) return "denied";
  try {
    const [v, t] = (localStorage.getItem(KEY) ?? "").split("|");
    if ((v !== "granted" && v !== "denied") || !(now - Number(t) < CHOICE_TTL_MS)) return null;
    return v;
  } catch {
    return null;
  }
}

/** Load Google's tag, once. Called only after consent. */
export function loadGa() {
  const w = gw();
  if (!ANALYTICS_ENABLED || granted) return;
  granted = true;
  w[`ga-disable-${GA_ID}`] = false;
  if (w.gtag) return;
  w.dataLayer = w.dataLayer || [];
  w.gtag = function gtag() {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments);
  };
  w.gtag("consent", "default", { analytics_storage: "granted", ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  w.gtag("js", new Date());
  // Page views are sent by pageView() below, because a client-side route change does not reload the page.
  w.gtag("config", GA_ID, { send_page_view: false, cookie_path: cookiePath(), allow_google_signals: false, allow_ad_personalization_signals: false });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
}

/** Expire Google's cookies for this site, whichever domain scope Google gave them. */
export function expireGaCookies() {
  const names = ["_ga", `_ga_${GA_ID.slice(2)}`];
  const labels = location.hostname.split(".");
  const domains: (string | null)[] = [null];
  for (let i = 0; i < labels.length - 1; i++) {
    const d = labels.slice(i).join(".");
    domains.push(d, `.${d}`);
  }
  for (const n of names)
    for (const d of domains) document.cookie = `${n}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${cookiePath()}${d ? `; domain=${d}` : ""}`;
}

/** Stop sending and remove the cookies. Returns true when Google's script had been loaded, because only a page reload removes it for certain. */
function stopGa(): boolean {
  const w = gw();
  const wasLoaded = !!w.gtag;
  granted = false;
  w[`ga-disable-${GA_ID}`] = true;
  expireGaCookies();
  return wasLoaded;
}

/** Store the visitor's choice. Returns true when the page should be reloaded so that Google's script is gone (a visitor who said yes and then no). */
export function setConsent(v: "granted" | "denied"): boolean {
  try {
    localStorage.setItem(KEY, `${v}|${Date.now()}`);
  } catch {
    /* private mode: the choice lasts until the page closes */
  }
  if (v === "granted") {
    loadGa();
    return false;
  }
  return stopGa();
}

/**
 * One page view for the current page (the tag is loaded with automatic page views off). A page is its path: a change that only alters the query string
 * (a filter, or the compare page adding ?ids=) is the same page and is not counted again.
 */
export function pageView() {
  if (!ANALYTICS_ENABLED || !granted) return;
  const here = location.pathname;
  if (here === lastSent) return;
  lastSent = here;
  gw().gtag?.("event", "page_view", { page_title: document.title, page_location: location.href, page_path: location.pathname });
}

export function track(event: "outbound_click", detail: CtaEvent): void {
  if (!ANALYTICS_ENABLED || !granted) return;
  gw().gtag?.("event", event, { tool: detail.tool, kind: detail.kind, placement: detail.placement });
}
