// Starts a throw-away PostgreSQL server for the database tests: a fresh data directory in the system temp folder, a free port on 127.0.0.1,
// no password (trust authentication, localhost only), fsync off. It never touches any other PostgreSQL installation or data directory.
// If no PostgreSQL server binaries can be found the tests that need a database are skipped with a clear message, they do not fail.
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import os from "node:os";
import path from "node:path";

export type Cluster = { binDir: string; dataDir: string; port: number; adminUrl: (db?: string) => string; stop: () => void };

const exe = process.platform === "win32" ? ".exe" : "";

/** Looks in PG_BIN_DIR, then on PATH, then in the usual install folders. Returns the folder holding initdb and pg_ctl, or null. */
export function findPostgresBin(): string | null {
  const candidates: string[] = [];
  if (process.env.PG_BIN_DIR) candidates.push(process.env.PG_BIN_DIR);
  for (const p of (process.env.PATH ?? "").split(path.delimiter)) candidates.push(p);
  const roots = process.platform === "win32" ? ["C:/Program Files/PostgreSQL"] : ["/usr/lib/postgresql", "/opt/homebrew/opt", "/usr/local/opt"];
  for (const r of roots) {
    try {
      for (const v of fs.readdirSync(r).sort().reverse()) candidates.push(path.join(r, v, "bin"), path.join(r, v));
    } catch {
      /* folder missing */
    }
  }
  for (const dir of candidates) {
    if (dir && fs.existsSync(path.join(dir, `initdb${exe}`)) && fs.existsSync(path.join(dir, `pg_ctl${exe}`)) && fs.existsSync(path.join(dir, `postgres${exe}`))) return dir;
  }
  return null;
}

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once("error", reject);
    s.listen(0, "127.0.0.1", () => {
      const { port } = s.address() as net.AddressInfo;
      s.close(() => resolve(port));
    });
  });
}

function run(bin: string, args: string[], label: string, extra: { logFile?: string; detached?: boolean } = {}) {
  // pg_ctl start leaves the server running with the stdio it was given. Captured pipes would then never close and spawnSync would wait forever,
  // so a detached start gets no pipes at all and its output is read from the server log instead.
  const r = spawnSync(bin, args, extra.detached ? { stdio: "ignore", windowsHide: true } : { encoding: "utf8", windowsHide: true });
  if (r.status !== 0) {
    let log = "";
    if (extra.logFile) {
      try {
        log = fs.readFileSync(extra.logFile, "utf8").slice(-600);
      } catch {
        /* no log yet */
      }
    }
    throw new Error(`${label} failed (${r.status}): ${(r.stderr || r.stdout || log || "").toString().slice(0, 600)}`);
  }
}

export async function startCluster(binDir: string): Promise<Cluster> {
  const dataDir = fs.mkdtempSync(path.join(os.tmpdir(), "aitp-pg-"));
  const port = await freePort();
  run(path.join(binDir, `initdb${exe}`), ["-D", dataDir, "-U", "postgres", "-A", "trust", "-E", "UTF8", "--locale=C", "--no-sync"], "initdb");
  const options = `-p ${port} -c listen_addresses=127.0.0.1 -c fsync=off -c synchronous_commit=off -c full_page_writes=off -c shared_buffers=16MB -c max_connections=60 -c log_min_messages=warning`;
  const logFile = path.join(dataDir, "server.log");
  run(path.join(binDir, `pg_ctl${exe}`), ["-D", dataDir, "-o", options, "-l", logFile, "-w", "-t", "60", "start"], "pg_ctl start", { logFile, detached: true });
  const stop = () => {
    spawnSync(path.join(binDir, `pg_ctl${exe}`), ["-D", dataDir, "-m", "immediate", "-w", "-t", "30", "stop"], { stdio: "ignore", windowsHide: true });
    for (let i = 0; i < 5; i++) {
      try {
        fs.rmSync(dataDir, { recursive: true, force: true });
        return;
      } catch {
        spawnSync(process.execPath, ["-e", "setTimeout(()=>{}, 400)"]);
      }
    }
  };
  return { binDir, dataDir, port, adminUrl: (db = "postgres") => `postgres://postgres@127.0.0.1:${port}/${db}`, stop };
}
