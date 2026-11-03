// Outbound-click tracking for affiliate and official buttons. No analytics script is loaded and nothing is sent anywhere.
//
// Every click on one of our outbound buttons is announced to the page as a browser event (OUTBOUND_EVENT). That costs nothing, stores nothing and
// leaves the device nowhere, so it is on for every visitor. It gives one reliable hook that any later provider (or a test) can listen to.
//
// Sending a click to a server stays off until ANALYTICS_ENABLED is true AND a transport is registered. Before turning it on: update the privacy
// policy and, where the law requires it, ask for consent first.
import type { AffiliateStatus } from "./affiliate";

export const ANALYTICS_ENABLED = false;
export const OUTBOUND_EVENT = "aitp:outbound";

export type CtaEvent = {
  tool: string;
  /** "affiliate" only when an approved affiliate link was the destination. */
  kind: "official" | "affiliate";
  status: AffiliateStatus;
  placement?: string;
};

type Transport = (detail: CtaEvent) => void;
let transport: Transport | null = null;

/** Wire in a provider. It is called only when ANALYTICS_ENABLED is true. */
export function registerTransport(t: Transport | null) {
  transport = t;
}

export function track(event: "outbound_click", detail: CtaEvent): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OUTBOUND_EVENT, { detail: { event, ...detail } }));
  if (ANALYTICS_ENABLED && transport) transport(detail);
}
