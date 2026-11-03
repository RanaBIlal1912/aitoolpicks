// An in-memory sign-in provider for working on the admin area on your own computer without a Supabase project, and for tests.
// It accepts a fixed password for e-mail addresses that are on the team, so it MUST NEVER run anywhere real: assertDevProviderAllowed refuses
// unless NODE_ENV is not "production", the flag AUTH_DEV_PROVIDER=1 is set, and the database is on this computer.
import { randomBytes, randomUUID } from "node:crypto";
import type { AuthProvider, AuthUser, Session } from "./provider.ts";

export const DEV_PASSWORD = "dev-password-only";

export function assertDevProviderAllowed(env: Record<string, string | undefined>): void {
  if (env.NODE_ENV === "production") throw new Error("the development sign-in provider cannot run when NODE_ENV is production");
  if (env.AUTH_DEV_PROVIDER !== "1") throw new Error("the development sign-in provider needs AUTH_DEV_PROVIDER=1");
  let host = "";
  try {
    host = new URL(env.DATABASE_URL ?? "").hostname;
  } catch {
    /* fall through to the refusal below */
  }
  if (!["localhost", "127.0.0.1", "::1", "[::1]"].includes(host)) throw new Error("the development sign-in provider only runs against a database on this computer");
}

type DevUser = { id: string; email: string; password: string; confirmed: boolean; banned: boolean };

export class InMemoryProvider implements AuthProvider {
  users = new Map<string, DevUser>();
  private access = new Map<string, { userId: string; expires: number }>();
  private refresh = new Map<string, string>();
  invites: string[] = [];
  recoveries: string[] = [];

  /** Add a user who can sign in with `password`. */
  addUser(email: string, password = DEV_PASSWORD, confirmed = true): string {
    const id = randomUUID();
    this.users.set(id, { id, email: email.toLowerCase(), password, confirmed, banned: false });
    return id;
  }
  private byEmail(email: string) {
    return [...this.users.values()].find((u) => u.email === email.trim().toLowerCase());
  }
  private issue(userId: string): Session {
    const accessToken = `dev-access-${randomBytes(18).toString("hex")}`;
    const refreshToken = `dev-refresh-${randomBytes(18).toString("hex")}`;
    this.access.set(accessToken, { userId, expires: Date.now() + 3600_000 });
    this.refresh.set(refreshToken, userId);
    return { accessToken, refreshToken, expiresIn: 3600 };
  }
  /** Make an access token stop working (tests use this to simulate expiry). */
  expire(accessToken: string) {
    this.access.delete(accessToken);
  }

  async signInWithPassword(email: string, password: string) {
    const u = this.byEmail(email);
    return u && !u.banned && u.password === password ? this.issue(u.id) : null;
  }
  async refreshSession(refreshToken: string) {
    const id = this.refresh.get(refreshToken);
    const u = id ? this.users.get(id) : undefined;
    if (!u || u.banned) return null;
    this.refresh.delete(refreshToken);
    return this.issue(u.id);
  }
  async signOut(accessToken: string) {
    this.access.delete(accessToken);
  }
  async sendRecovery(email: string) {
    this.recoveries.push(email.toLowerCase());
  }
  async updatePassword(accessToken: string, newPassword: string) {
    const a = this.access.get(accessToken);
    const u = a ? this.users.get(a.userId) : undefined;
    if (!u || newPassword.length < 8) return false;
    u.password = newPassword;
    return true;
  }
  async verifyAccessToken(token: string): Promise<AuthUser | null> {
    const a = this.access.get(token);
    const u = a && a.expires > Date.now() ? this.users.get(a.userId) : undefined;
    return u && !u.banned ? { authUserId: u.id, email: u.email, emailConfirmed: u.confirmed, aal: "aal1" } : null;
  }
  async inviteUser(email: string) {
    this.invites.push(email.toLowerCase());
    return { authUserId: this.byEmail(email)?.id ?? this.addUser(email) };
  }
  async setBanned(authUserId: string, banned: boolean) {
    const u = this.users.get(authUserId);
    if (u) u.banned = banned;
  }
}
