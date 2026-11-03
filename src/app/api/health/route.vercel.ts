// Liveness: answers if the site is up. Touches no database and reveals nothing. Exists only in the Vercel build (see next.config.mjs).
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json({ status: "ok", time: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
}
