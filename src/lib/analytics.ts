// Google Analytics 4, behind the visitor's consent.
//
// Off unless NEXT_PUBLIC_GA_ID is set at build time (the deploy workflow does not set it until the owner approves). Even when it is set, nothing is loaded and
// nothing is sent until the visitor presses "Allow analytics"; "No thanks", or a browser Global Privacy Control / Do Not Track signal, keeps it off.
// Ads features are switched off (no Google signals, no ad personalisation). The /privacy/ page describes this and changes with ANALYTICS_ENABLED.
export const GA_ID = (process.env.NEXT_PUBLIC_GA_ID ?? "").trim();
export const ANALYTICS_ENABLED = /^G-[A-Z0-9]{6,}$/.test(GA_ID);

export type Consent = "granted" | "denied" | null;
export type CtaEvent = { tool: string; kind: "official" | "affiliate"; placement?: string };

const KEY = "aitp-consent";
export const CONSENT_OPEN = "aitp-consent-open";

type Gtag = (...args: unknown[]) => void;
type GaWindow = { dataLayer?: unknown[]; gtag?: Gtag } & Record<string, unknown>;
const gw = () => window as unknown as GaWindow;

let granted = false;

/** True when the browser itself asks not to be tracked (Global Privacy Control or Do Not Track). */
export function privacySignal(): boolean {
  const n = navigator as Navigator & { globalPrivacyControl?: boolean };
  return n.globalPrivacyControl === true || n.doNotTrack === "1";
}

export function readConsent(): Consent {
  if (privacySignal()) return "denied";
  try {
    const v = localStorage.getItem(KEY);
    return v === "granted" || v === "denied" ? v : null;
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
  w.gtag("config", GA_ID, { allow_google_signals: false, allow_ad_personalization_signals: false });
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
}

/** Stop sending (a visitor who said yes can say no later). */
function stopGa() {
  const w = gw();
  granted = false;
  w[`ga-disable-${GA_ID}`] = true;
  // Remove the cookies Google set here, so saying no leaves nothing behind.
  const gone = "=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/";
  document.cookie = `_ga${gone}`;
  document.cookie = `_ga_${GA_ID.slice(2)}${gone}`;
}

export function setConsent(v: "granted" | "denied") {
  try {
    localStorage.setItem(KEY, v);
  } catch {
    /* private mode: the choice lasts until the page closes */
  }
  if (v === "granted") loadGa();
  else stopGa();
}

export function track(event: "outbound_click", detail: CtaEvent): void {
  if (!ANALYTICS_ENABLED || !granted) return;
  gw().gtag?.("event", event, { tool: detail.tool, kind: detail.kind, placement: detail.placement });
}
