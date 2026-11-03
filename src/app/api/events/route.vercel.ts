// Event collection endpoint. Does nothing unless ANALYTICS_ENABLED is true: when off it answers 204 before touching the database or reading anything.
// The rules (method, content type, size, same origin, validation, bots, rate limit) are in src/server/analytics/handler.ts. Exists only in the Vercel build.
import { handleEventRequest } from "../../../server/analytics/handler.ts";
import { getSql } from "../../../server/db/server.ts";
import { getEnv } from "../../../server/env.ts";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(req: Request) {
  const env = getEnv(["runtime"]);
  if (!env.ANALYTICS_ENABLED) return new Response(null, { status: 204 });
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > 4096) return new Response(null, { status: 413 });
  const body = await req.text();
  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const { status } = await handleEventRequest(
    { sql: getSql(), enabled: true, salt: env.ANALYTICS_SALT, visitorHash: env.ANALYTICS_VISITOR_HASH, siteOrigin: env.NEXT_PUBLIC_SITE_URL ? new URL(env.NEXT_PUBLIC_SITE_URL).origin : undefined },
    {
      method: req.method,
      contentType: req.headers.get("content-type") ?? undefined,
      body,
      origin: req.headers.get("origin") ?? undefined,
      userAgent: req.headers.get("user-agent") ?? undefined,
      country: req.headers.get("x-vercel-ip-country") ?? undefined,
      ip: forwarded,
    },
  );
  return new Response(null, { status });
}
