// Dev-only helper. `npm run covers` starts this server; open the page it prints and the images are written to
// public/images/covers. It is not part of the site build.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const outDir = path.join(root, "public", "images", "covers");

export default defineConfig({
  root,
  resolve: { alias: { "@": path.join(root, "src") } },
  server: { port: 8124, strictPort: true },
  plugins: [
    {
      name: "save-covers",
      configureServer(server) {
        server.middlewares.use("/__save", (req, res) => {
          if (req.method !== "POST") {
            res.statusCode = 405;
            res.end();
            return;
          }
          const name = new URL(req.url ?? "", "http://x").searchParams.get("name") ?? "";
          if (!/^[a-z0-9-]+\.jpg$/.test(name)) {
            res.statusCode = 400;
            res.end("bad name");
            return;
          }
          const chunks: Buffer[] = [];
          req.on("data", (c) => chunks.push(c));
          req.on("end", () => {
            fs.mkdirSync(outDir, { recursive: true });
            fs.writeFileSync(path.join(outDir, name), Buffer.concat(chunks));
            res.end("ok");
          });
        });
      },
    },
  ],
});
