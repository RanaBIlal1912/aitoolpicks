// Second pass for the tools whose home page blocked the first pass (scripts/fetch-tool-images.mjs). The image address for each is the og:image the
// vendor publishes on its own official page (read from that page in a normal browser, or from the vendor's product/about page when the home page
// refused a script). Mistral was dropped: its image carries a "#1" marketing claim we cannot verify. Same rules as the first pass: landscape, at least 900 px wide, not shared. Existing entries in content/tool-images.json are kept.
// Run: node scripts/fetch-tool-images-extra.mjs
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
const outDir = path.join(root, "public", "images", "tools");
const manifestPath = path.join(root, "content", "tool-images.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

const EXTRA = {
  canva: ["https://www.canva.com/", "https://content-management-files.canva.com/c37135f6-6d9a-4920-b659-4f5e12698b8d/og-image-global-1200x630.jpg"],
  chatgpt: ["https://openai.com/index/chatgpt/", "https://images.ctfassets.net/kftzwdyauwt9/7f6c5b76-875f-455d-ebb8813e1022/c16e0d3c81f4b9bcc9d9c65ed69b203d/chatgpt-og.jpg?w=1600&h=900&fit=fill"],
  claude: ["https://www.anthropic.com/claude", "https://assets.claude.com/0127845de9b30f0146d7d45c49049be8b749b158.jpg?w=2400&h=1260&fit=crop"],
  gamma: ["https://gamma.app/", "https://static.gamma.app/images/gamma-banner-8d71c455.png"],
  gemini: ["https://gemini.google/overview/", "https://lh3.googleusercontent.com/1E500rkSh8Gqkz2l12tkrKkMgsDmbQot0h3afeiRukXNficphb2zEE8o6J3dSKkiDGOOCcQ8WtRYzEYudgiYK9FkoQeYg_SP92-C=e365-pa-nu-w1200-rj"],
  ideogram: ["https://about.ideogram.ai/", "https://storage.googleapis.com/ideogram-static/website/images/ba16d402d8d0b906.jpeg"],
  julius: ["https://julius.ai/", "https://julius.ai/opengraph-image.png"],
  leonardo: ["https://leonardo.ai/", "https://assets.leonardo.ai/aY8aLVWLo0XkEfdx_og-leonardo.png?auto=compress%2Cformat&rect=0%2C0%2C2400%2C1260&w=1200&h=630&q=80&fit=crop"],
  lovable: ["https://lovable.dev/", "https://lovable.dev/img/opengraph-image.png"],
  otter: ["https://otter.ai/", "https://cdn.prod.website-files.com/618e9316785b3582a5178502/67dd5a945aeed07e329d4e10_fb6d82f0792801a1a0d814599859e23e_og-image-otter-optim.jpg"],
  replicate: ["https://replicate.com/docs", "https://replicate.com/_content/assets/og-image.y_bpW3_2.png"],
  scite: ["https://scite.ai/about", "https://cdn.scite.ai/assets/images/scite-opengraph.jpg"],
  whisper: ["https://openai.com/index/whisper/", "https://images.ctfassets.net/kftzwdyauwt9/7b33cec2-6549-4c33-3264e61e732f/b877de50db423af6eefaebde60f504b6/whisper-og.jpg?w=1600&h=900&fit=fill"],
  llamacpp: ["https://github.com/ggml-org/llama.cpp", "https://repository-images.githubusercontent.com/612354784/8b9eb0ec-6517-44a9-8a3a-fccddc678e57"],
};

for (const [id, [page, url]] of Object.entries(EXTRA)) {
  if (manifest[id]) continue;
  try {
    const r = await fetch(url, { headers: { "user-agent": UA, accept: "image/*" }, redirect: "follow", signal: AbortSignal.timeout(25000) });
    if (!r.ok) { console.log(id, "image", r.status); continue; }
    const buf = Buffer.from(await r.arrayBuffer());
    const m = await sharp(buf).metadata();
    const ar = (m.width ?? 1) / (m.height ?? 1);
    if (!m.width || m.width < 900 || ar < 1.3 || ar > 2.4) { console.log(id, "rejected", m.width + "x" + m.height); continue; }
    const img = sharp(buf);
    await img.clone().resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(outDir, `${id}.webp`));
    await img.clone().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 76 }).toFile(path.join(outDir, `${id}-sm.webp`));
    const info = await sharp(path.join(outDir, `${id}.webp`)).metadata();
    manifest[id] = { file: id, imageUrl: url, page, credit: new URL(page).hostname.replace(/^www\./, ""), width: info.width, height: info.height, fetched: new Date().toISOString().slice(0, 10) };
    console.log(id, "ok", m.width + "x" + m.height, "->", info.width + "x" + info.height);
  } catch (e) { console.log(id, "error", String(e.message).slice(0, 60)); }
}
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log("entries now", Object.keys(manifest).length);
