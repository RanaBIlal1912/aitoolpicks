// Makes the 960 px "-md" file for every photograph in public/images/photo from its 1920 px original (quality 70; the photos sit under a tint on the site).
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
const dir = path.join(process.cwd(), "public/images/photo");
let n = 0;
for (const f of fs.readdirSync(dir)) {
  if (/-(sm|md)\.webp$/.test(f) || !f.endsWith(".webp")) continue;
  const out = path.join(dir, f.replace(".webp", "-md.webp"));
  await sharp(path.join(dir, f)).resize({ width: 960 }).webp({ quality: 70 }).toFile(out);
  n++;
}
console.log("md files written:", n);
