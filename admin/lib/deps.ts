// Builds the authentication dependencies for the admin app. Server only.
import "server-only";
import { getEnv } from "../../src/server/env.ts";
import { getSql } from "../../src/server/db/server.ts";
import type { AuthDeps } from "../../src/server/auth/authorize.ts";
import { assertDevProviderAllowed, DEV_PASSWORD, InMemoryProvider } from "../../src/server/auth/dev-provider.ts";
import { createSupabaseProvider, type AuthProvider } from "../../src/server/auth/provider.ts";
import type { Sql } from "../../src/server/db/client.ts";

/** Development only: any e-mail address that is on the team can sign in with DEV_PASSWORD. Guarded by assertDevProviderAllowed. */
class DevTeamProvider extends InMemoryProvider {
  constructor(private lookup: () => Sql) {
    super();
  }
  async signInWithPassword(email: string, password: string) {
    const known = [...this.users.values()].some((u) => u.email === email.trim().toLowerCase());
    if (!known && password === DEV_PASSWORD) {
      const [m] = await this.lookup()<{ n: number }[]>`select count(*)::int as n from team_members where lower(email) = ${email.trim().toLowerCase()} and status <> 'disabled'`;
      if (m.n > 0) this.addUser(email);
    }
    return super.signInWithPassword(email, password);
  }
}

const g = globalThis as unknown as { __adminDeps?: AuthDeps & { deployHookUrl?: string } };

export function getDeps(): AuthDeps & { deployHookUrl?: string } {
  if (g.__adminDeps) return g.__adminDeps;
  const db = getEnv(["database"]);
  const runtime = getEnv(["runtime"]);
  let provider: AuthProvider;
  let requireMfa = false;
  let ipSalt: string | undefined;
  if (process.env.AUTH_DEV_PROVIDER === "1") {
    assertDevProviderAllowed({ ...process.env, DATABASE_URL: db.DATABASE_URL });
    provider = new DevTeamProvider(getSql);
  } else {
    const auth = getEnv(["auth"]);
    provider = createSupabaseProvider({ url: auth.SUPABASE_URL, anonKey: auth.SUPABASE_ANON_KEY, serviceRoleKey: auth.SUPABASE_SERVICE_ROLE_KEY });
    requireMfa = auth.AUTH_REQUIRE_MFA;
    ipSalt = auth.AUDIT_IP_SALT;
  }
  return (g.__adminDeps = { sql: getSql(), provider, requireMfa, ipSalt, deployHookUrl: runtime.DEPLOY_HOOK_URL });
}

export const isDevProvider = () => process.env.AUTH_DEV_PROVIDER === "1";
