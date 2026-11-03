// Makes the roles, permissions and grants in the database equal to src/server/auth/permissions.ts. Safe to run repeatedly; run it after every migration.
//   node scripts/auth/seed-access.ts           (a database that is not on this computer needs --confirm=<host>)
import { createSql } from "../../src/server/db/client.ts";
import { seedAccess } from "../../src/server/auth/seed.ts";
import { databaseEnvOrExit, hostOf, isLocal } from "../db/env.ts";

const env = databaseEnvOrExit();
const host = hostOf(env.url);
if (!isLocal(env.url) && !process.argv.includes(`--confirm=${host}`)) {
  console.error(`This would change roles and permissions in the database at ${host}, which is not on this computer. Re-run with --confirm=${host} if that is what you intend.`);
  process.exit(2);
}
const sql = createSql(env.url, { ssl: env.DATABASE_SSL, max: 1, applicationName: "aitoolpicks-seed-access" });
try {
  const r = await seedAccess(sql);
  console.log(r.changed ? `Updated roles and permissions on ${host}:` : `Roles and permissions on ${host} already match the code.`);
  for (const [k, v] of Object.entries(r)) if (Array.isArray(v) && v.length) console.log(v.length > 12 ? `  ${k}: ${v.length}` : `  ${k}: ${v.join(", ")}`);
} finally {
  await sql.end({ timeout: 5 });
}
