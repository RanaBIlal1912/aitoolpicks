// Static export so the site can be hosted on GitHub Pages (or any static host).
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));
const isProd = process.env.NODE_ENV === "production";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? (isProd ? "/aitoolpicks" : "");

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  reactStrictMode: true,
  turbopack: { root },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;
