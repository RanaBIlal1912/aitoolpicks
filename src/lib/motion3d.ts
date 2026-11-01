// The 3D hero and the 3D map stay off for visitors who ask for less motion or less data. This lets such a visitor switch them on, and remembers the choice in this browser.
const KEY = "aitp-3d";
const EVT = "aitp-3d-optin";

export type MotionLimit = "reduced-motion" | "data-saver" | null;

/** Why the 3D scenes are off by default for this visitor, or null when nothing holds them back. */
export function motionLimit(): MotionLimit {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return "reduced-motion";
  if ((navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData) return "data-saver";
  return null;
}

export function optedIn(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

/** The visitor chose to see the 3D scenes. Every 3D scene on the page starts. */
export function optIn() {
  try {
    localStorage.setItem(KEY, "1");
  } catch {
    /* private mode: the choice then lasts until the page closes */
  }
  window.dispatchEvent(new Event(EVT));
}

export function onOptIn(cb: () => void) {
  window.addEventListener(EVT, cb, { once: true });
  return () => window.removeEventListener(EVT, cb);
}
