// Finds the preview image each vendor publishes for its own product (the og:image / twitter:image on its official site), downloads it, resizes it
// and records where it came from. These are the vendor's own images, shown with credit and a link on that tool's page to identify the product.
// They are not licensed for re-use by third parties, so nothing is taken from anywhere but the tool's official site, and an image is skipped when it
// is too small, not landscape, or shared by several tools. Run: node scripts/fetch-tool-images.mjs
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import sharp from "sharp";

const root = process.cwd();
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0 Safari/537.36 AIToolPicksImageCheck/1.0";
const outDir = path.join(root, "public", "images", "tools");
fs.mkdirSync(outDir, { recursive: true });
const tools = fs.readdirSync(path.join(root, "content", "tools")).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(fs.readFileSync(path.join(root, "content", "tools", f), "utf-8")));
const manifestPath = path.join(root, "content", "tool-images.json");
const manifest = {};
const skipped = {};

function meta(html, keys) {
  for (const k of keys) {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${k}["'][^>]*>`, "i");
    const tag = html.match(re)?.[0];
    const c = tag?.match(/content=["']([^"']+)["']/i)?.[1];
    if (c) return c.replace(/&amp;/g, "&");
  }
  return null;
}

async function one(t) {
  const page = t.verification?.officialUrl || t.website;
  try {
    const r = await fetch(page, { headers: { "user-agent": UA, accept: "text/html" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    if (!r.ok) return void (skipped[t.id] = `page ${r.status}`);
    const html = (await r.text()).slice(0, 400000);
    const raw = meta(html, ["og:image", "og:image:url", "twitter:image", "twitter:image:src"]);
    if (!raw) return void (skipped[t.id] = "no og:image");
    const url = new URL(raw, r.url).href;
    if (/\.svg(\?|$)/i.test(url)) return void (skipped[t.id] = "svg");
    const ir = await fetch(url, { headers: { "user-agent": UA }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    if (!ir.ok) return void (skipped[t.id] = `image ${ir.status}`);
    const buf = Buffer.from(await ir.arrayBuffer());
    const m = await sharp(buf).metadata();
    if (!m.width || !m.height) return void (skipped[t.id] = "unreadable");
    const ar = m.width / m.height;
    if (m.width < 900 || ar < 1.3 || ar > 2.4) return void (skipped[t.id] = `size ${m.width}x${m.height}`);
    const hash = crypto.createHash("sha1").update(buf).digest("hex");
    manifest[t.id] = { file: t.id, imageUrl: url, page: r.url, credit: new URL(r.url).hostname.replace(/^www\./, ""), hash, width: 0, height: 0, fetched: new Date().toISOString().slice(0, 10), _buf: buf };
  } catch (e) {
    skipped[t.id] = String(e.message || e).slice(0, 60);
  }
}

const queue = [...tools];
await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length) await one(queue.shift()); }));

// Drop images shared by several tools (generic vendor images).
const count = {};
for (const m of Object.values(manifest)) count[m.hash] = (count[m.hash] ?? 0) + 1;
for (const [id, m] of Object.entries(manifest)) {
  if (count[m.hash] > 1) { skipped[id] = "shared image"; delete manifest[id]; continue; }
  const img = sharp(m._buf);
  await img.clone().resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(outDir, `${id}.webp`));
  await img.clone().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 76 }).toFile(path.join(outDir, `${id}-sm.webp`));
  const info = await sharp(path.join(outDir, `${id}.webp`)).metadata();
  m.width = info.width; m.height = info.height; delete m._buf; delete m.hash;
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log("kept", Object.keys(manifest).length, "of", tools.length);
console.log(JSON.stringify(skipped));
