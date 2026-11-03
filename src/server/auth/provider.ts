// The sign-in provider. Everything else in src/server/auth talks to the AuthProvider interface, so replacing Supabase Auth means writing one
// more implementation here and nothing else (decision D-03). This file uses fetch only: no Supabase library is installed.
//
// The browser never sees the service-role key. Public sign-up is switched off in the Supabase project (a dashboard setting this code cannot
// check); as a second line of defence an unknown or unconfirmed e-mail address is never turned into a team member (members.ts).
import { z } from "zod";

export type AuthUser = { authUserId: string; email: string; emailConfirmed: boolean; aal: "aal1" | "aal2" | null };

export type Session = { accessToken: string; refreshToken: string; expiresIn: number };

export interface AuthProvider {
  /** Check e-mail and password. null = wrong credentials (the reason is never revealed). */
  signInWithPassword(email: string, password: string): Promise<Session | null>;
  /** Exchange a refresh token for a new session. null = the refresh token is no longer valid. */
  refreshSession(refreshToken: string): Promise<Session | null>;
  /** End this session at the auth server. Best effort. */
  signOut(accessToken: string): Promise<void>;
  /** Send a password-set / recovery e-mail. Always resolves the same way whether or not the address exists. */
  sendRecovery(email: string, redirectTo: string): Promise<void>;
  /** Set a new password for the signed-in user (also used after an invitation or recovery link). */
  updatePassword(accessToken: string, newPassword: string): Promise<boolean>;
  /** Ask the auth server whether this access token is valid right now. null = not valid; throws AuthUnavailableError if the server cannot be reached. */
  verifyAccessToken(token: string): Promise<AuthUser | null>;
  /** Create the auth user and send the invitation e-mail. Returns the auth user id. */
  inviteUser(email: string): Promise<{ authUserId: string }>;
  /** Stop (or allow again) new sign-ins and refreshes for a user. */
  setBanned(authUserId: string, banned: boolean): Promise<void>;
}

export class AuthUnavailableError extends Error {
  constructor(message = "the sign-in service could not be reached") {
    super(message);
    this.name = "AuthUnavailableError";
  }
}

const userSchema = z.object({ id: z.uuid(), email: z.string().min(3), email_confirmed_at: z.string().nullable().optional() });
const sessionSchema = z.object({ access_token: z.string().min(10), refresh_token: z.string().min(1), expires_in: z.number().positive() });
const JWT_SHAPE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

/** Read the assurance level from a token the auth server has already accepted. Never used to decide whether a token is valid. */
function aalOf(token: string): "aal1" | "aal2" | null {
  try {
    const payload = JSON.parse(Buffer.from(token.split(".")[1], "base64url").toString("utf8")) as { aal?: string };
    return payload.aal === "aal2" ? "aal2" : payload.aal === "aal1" ? "aal1" : null;
  } catch {
    return null;
  }
}

export function createSupabaseProvider(config: { url: string; anonKey: string; serviceRoleKey: string; fetch?: typeof fetch; timeoutMs?: number }): AuthProvider {
  const base = config.url.replace(/\/+$/, "");
  const doFetch = config.fetch ?? fetch;
  const call = async (path: string, init: RequestInit) => {
    try {
      return await doFetch(`${base}${path}`, { ...init, signal: AbortSignal.timeout(config.timeoutMs ?? 5000) });
    } catch {
      throw new AuthUnavailableError();
    }
  };
  const adminHeaders = { apikey: config.serviceRoleKey, Authorization: `Bearer ${config.serviceRoleKey}`, "Content-Type": "application/json" };

  const toSession = async (res: Response): Promise<Session | null> => {
    if (res.status === 400 || res.status === 401 || res.status === 403 || res.status === 422) return null;
    if (!res.ok) throw new AuthUnavailableError(`the sign-in service answered ${res.status}`);
    const parsed = sessionSchema.safeParse(await res.json().catch(() => null));
    if (!parsed.success) throw new AuthUnavailableError("the sign-in service sent an answer this server does not understand");
    return { accessToken: parsed.data.access_token, refreshToken: parsed.data.refresh_token, expiresIn: parsed.data.expires_in };
  };
  const anonHeaders = { apikey: config.anonKey, "Content-Type": "application/json" };

  return {
    async signInWithPassword(email, password) {
      if (!email || !password || password.length > 1000) return null;
      return toSession(await call("/auth/v1/token?grant_type=password", { method: "POST", headers: anonHeaders, body: JSON.stringify({ email, password }) }));
    },

    async refreshSession(refreshToken) {
      if (!refreshToken || refreshToken.length > 1000) return null;
      return toSession(await call("/auth/v1/token?grant_type=refresh_token", { method: "POST", headers: anonHeaders, body: JSON.stringify({ refresh_token: refreshToken }) }));
    },

    async signOut(accessToken) {
      await call("/auth/v1/logout?scope=local", { method: "POST", headers: { apikey: config.anonKey, Authorization: `Bearer ${accessToken}` } }).catch(() => undefined);
    },

    async sendRecovery(email, redirectTo) {
      await call(`/auth/v1/recover?redirect_to=${encodeURIComponent(redirectTo)}`, { method: "POST", headers: anonHeaders, body: JSON.stringify({ email }) }).catch(() => undefined);
    },

    async updatePassword(accessToken, newPassword) {
      const res = await call("/auth/v1/user", { method: "PUT", headers: { ...anonHeaders, Authorization: `Bearer ${accessToken}` }, body: JSON.stringify({ password: newPassword }) });
      if (res.status === 401 || res.status === 403 || res.status === 422) return false;
      if (!res.ok) throw new AuthUnavailableError(`the sign-in service answered ${res.status}`);
      return true;
    },

    async verifyAccessToken(token) {
      if (token.length > 4096 || !JWT_SHAPE.test(token)) return null; // not worth a network call
      const res = await call("/auth/v1/user", { headers: { apikey: config.anonKey, Authorization: `Bearer ${token}` } });
      if (res.status === 401 || res.status === 403) return null;
      if (!res.ok) throw new AuthUnavailableError(`the sign-in service answered ${res.status}`);
      const parsed = userSchema.safeParse(await res.json().catch(() => null));
      if (!parsed.success) throw new AuthUnavailableError("the sign-in service sent an answer this server does not understand");
      return { authUserId: parsed.data.id, email: parsed.data.email.toLowerCase(), emailConfirmed: !!parsed.data.email_confirmed_at, aal: aalOf(token) };
    },

    async inviteUser(email) {
      const res = await call("/auth/v1/invite", { method: "POST", headers: adminHeaders, body: JSON.stringify({ email }) });
      if (!res.ok) throw new Error(`the invitation could not be sent (sign-in service answered ${res.status})`); // the body is not echoed: it can repeat the address
      const parsed = z.object({ id: z.uuid() }).safeParse(await res.json().catch(() => null));
      if (!parsed.success) throw new Error("the invitation was sent but the sign-in service did not return a user id");
      return { authUserId: parsed.data.id };
    },

    async setBanned(authUserId, banned) {
      const res = await call(`/auth/v1/admin/users/${encodeURIComponent(authUserId)}`, { method: "PUT", headers: adminHeaders, body: JSON.stringify({ ban_duration: banned ? "876000h" : "none" }) });
      if (!res.ok) throw new Error(`the account could not be ${banned ? "blocked" : "unblocked"} at the sign-in service (answered ${res.status})`);
    },
  };
}
