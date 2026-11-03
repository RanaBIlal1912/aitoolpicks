// Prove a backup works: restore it into a scratch database on a LOCAL PostgreSQL, compare every table with the manifest, run the health checks, drop the scratch database.
//   node scripts/db/restore-check.ts --file=backups/db/<file>.dump --into=postgres://user@localhost:5432/postgres [--keep]
// BACKUP_PASSPHRASE is needed for an encrypted backup. Refuses any server that is not on this computer: it creates and drops a database.
import { restoreCheck } from "../../src/server/db/backup.ts";
import { hostOf, isLocal, loadLocalEnv } from "./env.ts";

loadLocalEnv();
const arg = (n: string) => process.argv.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const file = arg("file");
const into = arg("into");
if (!file || !into) {
  console.error("Usage: node scripts/db/restore-check.ts --file=<backup.dump> --into=<postgres url of a LOCAL server> [--keep]");
  process.exit(2);
}
if (!isLocal(into)) {
  console.error(`Refusing: ${hostOf(into)} is not on this computer. A restore check creates and drops a database, so it only runs locally.`);
  process.exit(2);
}
const r = await restoreCheck(into, file, { passphrase: process.env.BACKUP_PASSPHRASE || undefined, keep: process.argv.includes("--keep") });
console.log(`${r.ok ? "RESTORE OK" : "RESTORE FAILED"}: ${r.tables} tables, ${r.rows} rows, health ${r.health}.`);
for (const p of r.problems) console.log(`  - ${p}`);
process.exit(r.ok ? 0 : 1);
