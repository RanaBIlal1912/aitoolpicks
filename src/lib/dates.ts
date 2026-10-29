/** Format an ISO date (YYYY-MM-DD) for display. Safe to use from server and client components. */
export function formatChecked(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
