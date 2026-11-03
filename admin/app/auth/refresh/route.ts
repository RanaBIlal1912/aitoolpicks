// Exchanges the refresh cookie for a new session, then returns to the page that asked. Only same-site paths are followed.
import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { getDeps } from "../../../lib/deps.ts";
import { clearSession, RT, safeNext, setSession } from "../../../lib/session.ts";

export async function GET(req: NextRequest) {
  const next = safeNext(req.nextUrl.searchParams.get("next"));
  const refresh = (await cookies()).get(RT)?.value;
  try {
    const session = refresh ? await getDeps().provider.refreshSession(refresh) : null;
    if (session) {
      await setSession(session);
      return NextResponse.redirect(new URL(next, req.url));
    }
  } catch {
    return NextResponse.redirect(new URL("/unavailable", req.url));
  }
  await clearSession();
  return NextResponse.redirect(new URL(`/login?next=${encodeURIComponent(next)}`, req.url));
}
