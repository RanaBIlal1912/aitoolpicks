// Database health, for an uptime monitor. Requires "Authorization: Bearer <HEALTH_SECRET>"; without HEALTH_SECRET configured the route does not exist (404).
// The report contains cleaned messages only: no connection string, password or address. Exists only in the Vercel build.
import { checkBearer } from "../../../../server/http/bearer.ts";
import { getSql } from "../../../../server/db/server.ts";
import { runHealth } from "../../../../server/db/health.ts";
import { expectedTablesFromSql, readJournalWhen } from "../../../../server/db/migrations.ts";
import { getEnv } from "../../../../server/env.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: Request) {
  const secret = getEnv(["runtime"]).HEALTH_SECRET;
  if (!secret) return new Response(null, { status: 404 });
  if (!checkBearer(req.headers.get("authorization"), secret)) return new Response(null, { status: 401, headers: { "WWW-Authenticate": "Bearer" } });
  const report = await runHealth(getSql(), { expectedMigrations: readJournalWhen(), expectedTables: expectedTablesFromSql() });
  return Response.json(report, { status: report.status === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}
