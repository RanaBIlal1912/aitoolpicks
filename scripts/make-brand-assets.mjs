// Renders the AI Tool Picks mark (public/brand/mark.svg) to the PNG files browsers and social networks need:
// favicon-32.png, icon-192.png, icon-512.png, apple-touch-icon.png and og.png. Run `npm run brand` after changing the mark,
// then commit public/brand. The files are plain static assets, so the GitHub Pages base path resolves them like any other file.
import fs from "node:fs";
import path from "node:path";
import { ImageResponse } from "next/dist/compiled/@vercel/og/index.node.js";

const dir = path.join(process.cwd(), "public", "brand");
const svg = fs.readFileSync(path.join(dir, "mark.svg"), "utf-8");
const uri = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
const el = (type, style, children) => ({ type, props: { style: { display: "flex", ...style }, children } });
const img = (px) => ({ type: "img", props: { src: uri, width: px, height: px, style: { width: px, height: px } } });

async function write(name, w, h, tree) {
  const res = new ImageResponse(tree, { width: w, height: h });
  fs.writeFileSync(path.join(dir, name), Buffer.from(await res.arrayBuffer()));
  console.log("wrote", name, `${w}x${h}`);
}

await write("favicon-32.png", 32, 32, img(32));
await write("icon-192.png", 192, 192, img(192));
await write("icon-512.png", 512, 512, img(512));
await write("apple-touch-icon.png", 180, 180, el("div", { width: "100%", height: "100%", alignItems: "center", justifyContent: "center", background: "#05070d" }, [img(150)]));
await write(
  "og.png",
  1200,
  630,
  el("div", { width: "100%", height: "100%", flexDirection: "column", justifyContent: "center", padding: 84, color: "#fff", background: "linear-gradient(135deg, #05070d 0%, #0d1326 60%, #1a1b3a 100%)" }, [
    el("div", { alignItems: "center" }, [img(84), el("div", { fontSize: 44, fontWeight: 800, marginLeft: 24, letterSpacing: -1 }, "AI Tool Picks")]),
    el("div", { fontSize: 78, fontWeight: 800, marginTop: 56, lineHeight: 1.05, letterSpacing: -2, maxWidth: 980 }, "Find the AI tool that fits, and what it really costs"),
    el("div", { fontSize: 32, color: "#b9c3e0", marginTop: 32, maxWidth: 900 }, "Official prices with the date we checked them. Honest comparisons. Dated AI news with sources."),
  ]),
);
