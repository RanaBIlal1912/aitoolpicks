// Downloads the announcement image each source published for a story, resizes it and records the credit.
//
//   node scripts/fetch-news-images.mjs            fetch images that are listed in content/news-images.json but missing
//   node scripts/fetch-news-images.mjs --all      refetch everything
//
// Files get short names (m.file) because Windows limits full path length.
// Rules (see docs/NEWS_WORKFLOW.md): only a vendor's own announcement image from the page that announced the story, never a
// third-party outlet's photograph, and never an image that several unrelated stories share. Every image keeps a credit and a link to
// the page it came from. Stories without a suitable image get a generated illustration instead; that is not recorded here.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const manifestPath = path.join(root, "content", "news-images.json");
const outDir = path.join(root, "public", "images", "news");
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0 Safari/537.36 AIToolPicksImageCheck/1.0";
fs.mkdirSync(outDir, { recursive: true });
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
const all = process.argv.includes("--all");

for (const [slug, m] of Object.entries(manifest)) {
  const big = path.join(outDir, `${m.file}.webp`);
  if (!all && fs.existsSync(big)) continue;
  const res = await fetch(m.imageUrl, { headers: { "user-agent": UA }, redirect: "follow" });
  if (!res.ok) {
    console.log("FAILED", slug, res.status);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const img = sharp(buf);
  const meta = await img.metadata();
  await img.clone().resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }).toFile(big);
  await img.clone().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 78 }).toFile(path.join(outDir, `${m.file}-sm.webp`));
  const info = await sharp(big).metadata();
  m.width = info.width;
  m.height = info.height;
  m.fetched = new Date().toISOString().slice(0, 10);
  console.log("OK", slug, `${meta.width}x${meta.height} ->`, `${info.width}x${info.height}`, `${(fs.statSync(big).size / 1024).toFixed(0)} KB`);
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
