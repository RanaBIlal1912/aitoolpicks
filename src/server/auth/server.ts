// The authentication entry point for Next.js server code. "server-only" fails the build if a Client Component imports it, which keeps the
// service-role key out of the browser bundle. Every admin page, Server Action and Route Handler starts with:
//   const member = await requireMember(authDeps(), tokenFromCookie, "tools:update");
import "server-only";
import { getEnv } from "../env.ts";
import { getSql } from "../db/server.ts";
import type { AuthDeps } from "./authorize.ts";
import { createSupabaseProvider } from "./provider.ts";

export { requireMember, can, canActOnRow, canChangeFields, AuthError } from "./authorize.ts";

let deps: AuthDeps | undefined;
export function authDeps(): AuthDeps {
  if (!deps) {
    const env = getEnv(["database", "auth"]);
    deps = {
      sql: getSql(),
      provider: createSupabaseProvider({ url: env.SUPABASE_URL, anonKey: env.SUPABASE_ANON_KEY, serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY }),
      requireMfa: env.AUTH_REQUIRE_MFA,
      ipSalt: env.AUDIT_IP_SALT,
    };
  }
  return deps;
}
