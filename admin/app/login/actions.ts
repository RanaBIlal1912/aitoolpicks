"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { writeAudit } from "../../../src/server/auth/audit.ts";
import { AuthError, requireMember } from "../../../src/server/auth/authorize.ts";
import { AuthUnavailableError } from "../../../src/server/auth/provider.ts";
import { consume, keyHash, LIMITS } from "../../../src/server/auth/rate-limit.ts";
import { getDeps } from "../../lib/deps.ts";
import { AT, clearSession, clientIp, safeNext, setSession } from "../../lib/session.ts";

export type LoginState = { error?: string };
const input = z.object({ email: z.string().trim().toLowerCase().max(254), password: z.string().min(1).max(1000), next: z.string().optional() });
const GENERIC = "That e-mail address and password did not work, or the account is not allowed in. Try again or ask an owner.";
const salt = () => process.env.RATE_LIMIT_SALT ?? process.env.AUDIT_IP_SALT ?? "admin-local-rate-limit-salt";

export async function signIn(_: LoginState, form: FormData): Promise<LoginState> {
  const parsed = input.safeParse({ email: form.get("email"), password: form.get("password"), next: form.get("next") ?? undefined });
  if (!parsed.success) return { error: GENERIC };
  const { email, password } = parsed.data;
  const deps = getDeps();
  const ip = await clientIp();

  // Limits first, so guessing is cheap to stop: per address, and per source address.
  const byEmail = await consume(deps.sql, email, "login", LIMITS.login, { salt: salt() });
  const byIp = ip ? await consume(deps.sql, ip, "login.ip", { limit: 30, windowSeconds: 900 }, { salt: salt() }) : null;
  if (!byEmail.allowed || (byIp && !byIp.allowed)) {
    return { error: `Too many attempts. Wait ${Math.ceil(Math.max(byEmail.retryAfterSeconds, byIp?.retryAfterSeconds ?? 0) / 60)} minute(s) and try again.` };
  }

  let ok = false;
  try {
    const session = await deps.provider.signInWithPassword(email, password);
    if (session) {
      try {
        const member = await requireMember(deps, session.accessToken); // activates an invitation; refuses non-members and disabled accounts
        await setSession(session);
        await writeAudit(deps.sql, { actor: member.id, action: "auth.login", entityType: "team_member", entityId: member.id, ip }, { ipSalt: deps.ipSalt });
        ok = true;
      } catch (e) {
        await deps.provider.signOut(session.accessToken);
        if (!(e instanceof AuthError)) throw e;
        await writeAudit(deps.sql, { actor: null, action: "auth.login_refused", entityType: "login", entityId: keyHash(email, salt()).slice(0, 16), after: { reason: e.code }, ip }, { ipSalt: deps.ipSalt });
      }
    } else {
      await writeAudit(deps.sql, { actor: null, action: "auth.login_failed", entityType: "login", entityId: keyHash(email, salt()).slice(0, 16), ip }, { ipSalt: deps.ipSalt });
    }
  } catch (e) {
    if (e instanceof AuthUnavailableError) return { error: "The sign-in service cannot be reached right now. Try again in a minute." };
    throw e;
  }
  if (!ok) return { error: GENERIC };
  redirect(safeNext(parsed.data.next));
}

export async function signOutAction() {
  const deps = getDeps();
  const token = (await cookies()).get(AT)?.value;
  try {
    const member = token ? await requireMember(deps, token) : null;
    if (token) await deps.provider.signOut(token);
    if (member) await writeAudit(deps.sql, { actor: member.id, action: "auth.logout", entityType: "team_member", entityId: member.id }, { ipSalt: deps.ipSalt });
  } catch {
    /* signing out must always work, even when the session is already invalid */
  }
  await clearSession();
  redirect("/login");
}
