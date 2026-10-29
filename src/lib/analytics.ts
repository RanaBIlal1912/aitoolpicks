// Analytics-ready, but off. No script is loaded and nothing is sent anywhere.
// If a privacy-respecting analytics tool is added later, wire it in here, update the privacy policy first,
// and (where the law requires) ask for consent before calling track().
export const ANALYTICS_ENABLED = false;

export type CtaEvent = { tool: string; kind: "official" | "affiliate"; placement?: string };

export function track(event: "outbound_click", detail: CtaEvent): void {
  if (!ANALYTICS_ENABLED) return;
  // Intentionally empty until a provider is configured.
  void detail;
  void event;
}
