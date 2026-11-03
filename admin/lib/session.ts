// Session cookies and the guard every page and action calls. Server only.
import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { AuthError, requireMember, type Member } from "../../src/server/auth/authorize.ts";
import type { Session } from "../../src/server/auth/provider.ts";
import { getDeps } from "./deps.ts";

export const AT = "atp_at";
export const RT = "atp_rt";
const secure = process.env.NODE_ENV === "production";

export async function setSession(s: Session) {
  const jar = await cookies();
  const base = { httpOnly: true, secure, sameSite: "lax" as const, path: "/" };
  jar.set(AT, s.accessToken, { ...base, maxAge: Math.max(60, Math.floor(s.expiresIn)) });
  jar.set(RT, s.refreshToken, { ...base, maxAge: 60 * 60 * 24 * 30 });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(AT);
  jar.delete(RT);
}

/** Only same-site paths are followed after sign-in or refresh. */
export const safeNext = (n: unknown) => (typeof n === "string" && /^\/(?!\/)[\w\-/?=&.%]*$/.test(n) ? n : "/");

export async function clientIp(): Promise<string | undefined> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || undefined;
}

/** The signed-in member, or a redirect. `permission` is checked against the database on every call. Once per request per permission. */
export const requirePage = cache(async (path: string, permission?: string): Promise<Member> => {
  const jar = await cookies();
  try {
    return await requireMember(getDeps(), jar.get(AT)?.value, permission);
  } catch (e) {
    if (!(e instanceof AuthError)) throw e;
    if (e.status === 401) redirect(jar.get(RT) ? `/auth/refresh?next=${encodeURIComponent(path)}` : `/login?next=${encodeURIComponent(path)}`);
    if (e.status === 503) redirect("/unavailable");
    redirect(`/denied?reason=${encodeURIComponent(e.code)}`);
  }
});
