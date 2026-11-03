// The nightly job (analytics rollup and retention). Vercel Cron calls it with "Authorization: Bearer <CRON_SECRET>" when CRON_SECRET is set in the project;
// without CRON_SECRET the route does not exist (404). Safe to call repeatedly. Exists only in the Vercel build; the schedule is in vercel.json.
import { runNightly } from "../../../../server/analytics/rollup.ts";
import { getSql } from "../../../../server/db/server.ts";
import { getEnv } from "../../../../server/env.ts";
import { checkBearer } from "../../../../server/http/bearer.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(req: Request) {
  const secret = getEnv(["runtime"]).CRON_SECRET;
  if (!secret) return new Response(null, { status: 404 });
  if (!checkBearer(req.headers.get("authorization"), secret)) return new Response(null, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
  const result = await runNightly(getSql());
  return Response.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
}
