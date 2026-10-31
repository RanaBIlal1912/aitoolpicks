import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";

const root = path.resolve("out");
const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".woff2": "font/woff2", ".txt": "text/plain", ".xml": "application/xml", ".webmanifest": "application/manifest+json" };
http
  .createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (!p.startsWith("/aitoolpicks")) {
      res.writeHead(302, { Location: "/aitoolpicks/" });
      return res.end();
    }
    p = p.slice("/aitoolpicks".length) || "/";
    let f = path.join(root, p);
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, "index.html");
    if (!fs.existsSync(f)) {
      res.writeHead(404);
      return res.end("not found");
    }
    const ext = path.extname(f);
    const h = { "Content-Type": types[ext] || "application/octet-stream" };
    if ([".html", ".js", ".css", ".json", ".svg", ".txt", ".xml"].includes(ext)) {
      h["Content-Encoding"] = "gzip";
      res.writeHead(200, h);
      return fs.createReadStream(f).pipe(zlib.createGzip()).pipe(res);
    }
    res.writeHead(200, h);
    fs.createReadStream(f).pipe(res);
  })
  .listen(8124, () => console.log("Preview: http://localhost:8124/aitoolpicks/"));
