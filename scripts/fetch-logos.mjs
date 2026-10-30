// Fetches each tool's own icon from its official website and records where it came from.
//
//   node scripts/fetch-logos.mjs            fetch tools that have no logo yet
//   node scripts/fetch-logos.mjs --all      refetch every tool
//   node scripts/fetch-logos.mjs ollama groq   refetch specific ids
//   add --curl to use the system curl (works on some sites that refuse Node's fetch)
//   add --fallback to try the favicon service for sites that block scripted requests
//
// What it does, per tool (website comes from content/tools/<id>.json):
//   1. Reads the official page's <link rel="icon | apple-touch-icon | mask-icon"> tags and well-known icon paths on the SAME site.
//   2. Prefers SVG, then the largest apple-touch-icon / PNG icon, then ICO.
//   3. Checks the bytes really are an image (magic numbers), rejects oversized files and SVGs with scripts or external references.
//   4. Saves it to public/logos/<id>.<ext> and writes content/logos.json (source URL, kind, size, date, review flag).
// If a site blocks the request, nothing is guessed: the tool is recorded as "missing" and the UI shows a plain letter mark.
// It never uses a competitor's or a stock image. Run it by hand; the build does not touch the network.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import os from "node:os";

const root = process.cwd();
const TOOLS_DIR = path.join(root, "content", "tools");
const OUT_DIR = path.join(root, "public", "logos");
const MANIFEST = path.join(root, "content", "logos.json");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36 AIToolPicksLogoCheck/1.0";
const MAX_BYTES = 600_000;
const TODAY = new Date().toISOString().slice(0, 10);

const args = process.argv.slice(2);
const all = args.includes("--all");
const only = args.filter((a) => !a.startsWith("--"));

fs.mkdirSync(OUT_DIR, { recursive: true });
const manifest = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, "utf-8")) : {};
const records = fs.readdirSync(TOOLS_DIR).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(TOOLS_DIR, f), "utf-8")));

// Some sites answer curl but refuse Node's fetch (bot protection looks at the TLS and header fingerprint). `--curl` uses the system curl
// for every request; it makes the same plain GET and nothing else.
const useCurl = args.includes("--curl");

async function get(url, { text = false, timeout = 15000 } = {}) {
  if (useCurl) {
    const tmp = path.join(os.tmpdir(), `logo-${crypto.randomBytes(6).toString("hex")}`);
    try {
      const out = execFileSync("curl", ["-sL", "-A", UA, "-m", String(Math.ceil(timeout / 1000)), "-o", tmp, "-w", "%{http_code} %{url_effective}", url], { encoding: "utf-8" });
      const [code, ...rest] = out.trim().split(" ");
      if (code !== "200") return { ok: false, status: Number(code) };
      return { ok: true, buf: fs.readFileSync(tmp), type: "", url: rest.join(" ") };
    } catch (e) {
      return { ok: false, status: "curl" };
    } finally {
      fs.rmSync(tmp, { force: true });
    }
  }
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeout);
  try {
    const res = await fetch(url, { headers: { "user-agent": UA, accept: text ? "text/html,*/*;q=0.8" : "image/*,*/*;q=0.8" }, redirect: "follow", signal: ctl.signal });
    if (!res.ok) return { ok: false, status: res.status };
    const buf = Buffer.from(await res.arrayBuffer());
    return { ok: true, buf, type: res.headers.get("content-type") ?? "", url: res.url };
  } catch (e) {
    return { ok: false, status: String(e.cause?.code ?? e.name) };
  } finally {
    clearTimeout(t);
  }
}

function sniff(buf) {
  if (buf.length < 8) return null;
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return { ext: "png", w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
  }
  if (buf[0] === 0 && buf[1] === 0 && buf[2] === 1 && buf[3] === 0) {
    const n = buf.readUInt16LE(4);
    let best = 0;
    for (let i = 0; i < n; i++) best = Math.max(best, buf[6 + i * 16] || 256);
    return { ext: "ico", w: best, h: best };
  }
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return { ext: "webp", w: 0, h: 0 };
  if (buf[0] === 0xff && buf[1] === 0xd8) return { ext: "jpg", w: 0, h: 0 };
  const head = buf.subarray(0, 2000).toString("utf-8").toLowerCase();
  if (head.includes("<svg")) {
    const s = buf.toString("utf-8");
    if (/<script|on[a-z]+\s*=|javascript:|<foreignobject|<!entity|xlink:href\s*=\s*["']https?:|href\s*=\s*["']https?:/i.test(s)) return { ext: "svg", unsafe: true };
    return { ext: "svg", w: 0, h: 0 };
  }
  return null;
}

function iconLinks(html, base) {
  const out = [];
  for (const m of html.matchAll(/<link\b[^>]*>/gi)) {
    const tag = m[0];
    const rel = /rel\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1]?.toLowerCase() ?? "";
    if (!/(^|\s)(icon|shortcut icon|apple-touch-icon(-precomposed)?|mask-icon)(\s|$)/.test(rel)) continue;
    const href = /href\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1];
    if (!href || href.startsWith("data:")) continue;
    const sizes = /sizes\s*=\s*["'](\d+)x\d+/i.exec(tag)?.[1];
    const type = /type\s*=\s*["']([^"']+)["']/i.exec(tag)?.[1] ?? "";
    let url;
    try {
      url = new URL(href, base).href;
    } catch {
      continue;
    }
    out.push({ url, kind: rel.includes("apple") ? "apple-touch-icon" : rel.includes("mask") ? "mask-icon" : "icon", size: Number(sizes) || 0, svg: /svg/.test(type) || /\.svg(\?|$)/i.test(url) });
  }
  return out;
}

function rank(c) {
  if (c.kind === "mask-icon") return -1; // monochrome silhouette, not the colour mark
  if (c.svg) return 100;
  if (c.kind === "apple-touch-icon") return 80 + Math.min(c.size || 180, 200) / 10;
  if (/\.png(\?|$)/i.test(c.url)) return 50 + Math.min(c.size || 32, 512) / 10;
  if (/\.ico(\?|$)/i.test(c.url)) return 10;
  return 20 + (c.size || 0) / 10;
}

function sameSite(a, b) {
  const h = (u) => new URL(u).hostname.replace(/^www\./, "").split(".").slice(-2).join(".");
  return h(a) === h(b);
}

async function findLogo(site) {
  const base = new URL(site).origin + "/";
  const page = await get(base, { text: true });
  const cands = [];
  if (page.ok) cands.push(...iconLinks(page.buf.toString("utf-8"), page.url ?? base));
  for (const p of ["apple-touch-icon.png", "favicon.svg", "favicon.png", "favicon.ico"]) {
    cands.push({ url: base + p, kind: p.startsWith("apple") ? "apple-touch-icon" : "icon", size: 0, svg: p.endsWith(".svg"), guess: true });
  }
  const seen = new Set();
  const ordered = cands.filter((c) => !seen.has(c.url) && seen.add(c.url)).filter((c) => rank(c) >= 0).sort((a, b) => rank(b) - rank(a));
  const notes = [];
  if (!page.ok) notes.push(`homepage ${page.status}`);
  for (const c of ordered) {
    if (!sameSite(c.url, site)) {
      // Official sites sometimes serve icons from their own CDN; allow it only when the page itself linked it.
      if (c.guess) continue;
    }
    const res = await get(c.url);
    if (!res.ok || res.buf.length > MAX_BYTES || res.buf.length < 100) continue;
    const info = sniff(res.buf);
    if (!info || info.unsafe) continue;
    if (info.ext === "ico" && info.w < 32) continue;
    return { buf: res.buf, info, source: res.url, kind: c.kind, notes };
  }
  return { missing: true, notes };
}

// Last resort for sites that block scripted requests (bot protection). The Google favicon service returns the icon the site itself
// publishes as its favicon; we call it only while fetching (never at runtime), download the file, and flag it for review.
// A generic globe (what the service returns for unknown sites) is detected and rejected.
let globeHash = null;
async function viaFaviconService(site) {
  if (!globeHash) {
    const g = await get("https://www.google.com/s2/favicons?domain=this-domain-does-not-exist-aitoolpicks.invalid&sz=128");
    globeHash = g.ok ? crypto.createHash("sha256").update(g.buf).digest("hex") : "none";
  }
  const host = new URL(site).hostname;
  const res = await get(`https://www.google.com/s2/favicons?domain=${host}&sz=128`);
  if (!res.ok || res.buf.length < 100) return null;
  if (crypto.createHash("sha256").update(res.buf).digest("hex") === globeHash) return null;
  const info = sniff(res.buf);
  if (!info || info.unsafe) return null;
  return { buf: res.buf, info, source: `https://www.google.com/s2/favicons?domain=${host}&sz=128`, kind: "icon" };
}

const targets = records.filter((r) => (only.length ? only.includes(r.id) : all || !manifest[r.id]?.file));
const queue = [...targets];
let done = 0;
async function worker() {
  while (queue.length) {
    const r = queue.shift();
    let found = await findLogo(r.logoSite ?? r.website);
    let viaService = false;
    if (found.missing && args.includes("--fallback")) {
      const alt = await viaFaviconService(r.logoSite ?? r.website);
      if (alt) {
        found = { ...alt, notes: found.notes };
        viaService = true;
      }
    }
    if (found.missing) {
      manifest[r.id] = { file: null, website: r.website, status: "missing", notes: found.notes.join("; ") || "no usable icon reachable", checked: TODAY };
      console.log("MISSING", r.id, found.notes.join("; "));
    } else {
      const file = `${r.id}.${found.info.ext}`;
      for (const f of fs.readdirSync(OUT_DIR)) if (f.startsWith(r.id + ".")) fs.rmSync(path.join(OUT_DIR, f));
      let out = found.buf;
      if (found.info.ext === "svg") {
        // Some marks switch colour with the visitor's OS theme; the site tile is fixed, so keep the default (light-scheme) colours.
        out = Buffer.from(out.toString("utf-8").replace(/@media\s*\(prefers-color-scheme:\s*dark\)\s*\{(?:[^{}]*\{[^{}]*\})*[^{}]*\}/g, "").replace(/@media\s*\(prefers-color-scheme:\s*light\)\s*\{((?:[^{}]*\{[^{}]*\})*[^{}]*)\}/g, "$1"));
      }
      fs.writeFileSync(path.join(OUT_DIR, file), out);
      const small = found.info.ext !== "svg" && found.info.w > 0 && found.info.w < 96;
      manifest[r.id] = {
        ...(manifest[r.id]?.tile ? { tile: manifest[r.id].tile } : {}), // hand-set: "dark" for white-on-transparent marks
        file,
        website: r.website,
        source: found.source,
        kind: found.kind,
        format: found.info.ext,
        width: found.info.w || null,
        bytes: found.buf.length,
        sha256: crypto.createHash("sha256").update(found.buf).digest("hex").slice(0, 16),
        status: viaService ? "needs-review" : small ? "low-resolution" : "ok",
        origin: viaService ? "favicon-service (the site's own favicon, fetched because the site blocks scripts)" : "official-site",
        checked: TODAY,
      };
      console.log("OK     ", r.id, found.info.ext, found.info.w || "", found.kind, "<-", found.source);
    }
    done++;
  }
}
await Promise.all(Array.from({ length: 6 }, worker));
const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
fs.writeFileSync(MANIFEST, JSON.stringify(sorted, null, 2) + "\n");
console.log(`\n${done} processed. ok=${Object.values(sorted).filter((m) => m.status === "ok").length} low-res=${Object.values(sorted).filter((m) => m.status === "low-resolution").length} needs-review=${Object.values(sorted).filter((m) => m.status === "needs-review").length} missing=${Object.values(sorted).filter((m) => m.status === "missing").length}`);
