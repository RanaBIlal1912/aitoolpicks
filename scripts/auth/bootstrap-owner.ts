// Creates the first owner. There is no public sign-up, so someone has to be on the team before anyone can invite anyone else.
//   node scripts/auth/bootstrap-owner.ts --email=you@example.com [--confirm=<host>]
// This only adds a row with status "invited". The person then signs in with that confirmed e-mail address (create the account in the Supabase
// dashboard under Authentication > Users > Invite user, or send the invitation from there) and the first sign-in activates the row.
// It refuses to run when an owner already exists, and it never touches the sign-in service.
import { createSql } from "../../src/server/db/client.ts";
import { writeAudit } from "../../src/server/auth/audit.ts";
import { seedAccess } from "../../src/server/auth/seed.ts";
import { databaseEnvOrExit, hostOf, isLocal } from "../db/env.ts";

const email = process.argv.find((a) => a.startsWith("--email="))?.slice(8).trim().toLowerCase();
if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
  console.error("Usage: node scripts/auth/bootstrap-owner.ts --email=you@example.com");
  process.exit(2);
}
const env = databaseEnvOrExit();
const host = hostOf(env.url);
if (!isLocal(env.url) && !process.argv.includes(`--confirm=${host}`)) {
  console.error(`This would add an owner to the database at ${host}, which is not on this computer. Re-run with --confirm=${host} if that is what you intend.`);
  process.exit(2);
}
const sql = createSql(env.url, { ssl: env.DATABASE_SSL, max: 1, applicationName: "aitoolpicks-bootstrap-owner" });
try {
  await seedAccess(sql);
  await sql.begin(async (raw) => {
    const tx = raw as unknown as typeof sql;
    const [{ n }] = await tx<{ n: number }[]>`select count(*)::int as n from team_members m join roles r on r.id = m.role_id where r.key = 'owner'`;
    if (n > 0) {
      console.error("An owner already exists. Invite further people from the admin area, as an owner.");
      process.exit(1);
    }
    const [m] = await tx<{ id: number }[]>`insert into team_members (email, role_id, status, invited_at) values (${email}, (select id from roles where key = 'owner'), 'invited', now()) returning id`;
    await writeAudit(tx, { actor: null, action: "team.bootstrap_owner", entityType: "team_member", entityId: m.id, after: { email, role: "owner" } });
  });
  console.log(`Added ${email} as the first owner (status: invited). They become active the first time they sign in with that confirmed address.`);
} finally {
  await sql.end({ timeout: 5 });
}
