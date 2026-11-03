// Copies the original data (content/ and src/data/*.ts) to backups/<UTC timestamp>/ and writes MANIFEST.sha256, then re-reads the copy to prove it matches.
// Read-only with respect to the originals. backups/ is git-ignored; keep a copy outside this folder too.
//   node scripts/migrate/backup.ts
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const dest = path.join(root, "backups", stamp);
const files: string[] = [];
const walk = (dir: string) => {
  for (const e of fs.readdirSync(path.join(root, dir), { withFileTypes: true })) {
    const rel = `${dir}/${e.name}`;
    if (e.isDirectory()) walk(rel);
    else if (dir.startsWith("content") || (dir === "src/data" && e.name.endsWith(".ts"))) files.push(rel);
  }
};
walk("content");
walk("src/data");

const sha = (p: string) => createHash("sha256").update(fs.readFileSync(p)).digest("hex");
const manifest: string[] = [];
for (const rel of files.sort()) {
  const from = path.join(root, rel);
  const to = path.join(dest, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
  if (sha(from) !== sha(to)) throw new Error(`copy of ${rel} does not match the original`);
  manifest.push(`${sha(from)}  ${rel}`);
}
fs.writeFileSync(path.join(dest, "MANIFEST.sha256"), manifest.join("\n") + "\n");
console.log(`Backed up ${files.length} files to backups/${stamp}/ (MANIFEST.sha256 written, every copy re-hashed and equal).`);
