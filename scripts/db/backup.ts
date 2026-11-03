// Take a backup of the database in DATABASE_DIRECT_URL (or DATABASE_URL): a dump file plus a manifest with every table's row count and a checksum.
//   node scripts/db/backup.ts [--out=backups/db]          encrypted when BACKUP_PASSPHRASE (12+ characters) is set
// The dump contains everything in the database, including team e-mail addresses and the audit log. Keep it private; backups/ is git-ignored.
import path from "node:path";
import { backupDatabase } from "../../src/server/db/backup.ts";
import { databaseEnvOrExit, hostOf } from "./env.ts";

const env = databaseEnvOrExit();
const dir = process.argv.find((a) => a.startsWith("--out="))?.slice(6) ?? "backups/db";
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const file = path.join(dir, `${hostOf(env.url).replace(/[^a-z0-9.-]/gi, "_")}-${stamp}.dump`);
const passphrase = process.env.BACKUP_PASSPHRASE || undefined;
const m = await backupDatabase(env.url, file, { passphrase });
console.log(`Backup written to ${file}${m.encrypted ? " (encrypted)" : " (NOT encrypted: set BACKUP_PASSPHRASE to encrypt)"}`);
console.log(`  ${Object.keys(m.tables).length} tables, ${Object.values(m.tables).reduce((a, b) => a + b, 0)} rows, ${(m.bytes / 1024).toFixed(0)} KB, sha256 ${m.sha256.slice(0, 16)}...`);
console.log("A backup is only proven by restoring it: run  npm run db:restore-check -- --file=" + file);
