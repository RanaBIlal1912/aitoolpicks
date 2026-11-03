// Two ways to build the same public site:
//   GitHub Pages (default):  a static export under /aitoolpicks. No server features exist, so none are enabled.
//   Vercel (VERCEL=1, or DEPLOY_TARGET=vercel):  the same pages, still generated at build time, served from the root of a domain, plus the server-only
//   files (health, events, cron) and real redirects and security headers. Files named *.vercel.ts are routes that exist only in this mode.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { legacyRedirects } from "./scripts/hosting/redirects.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));
const onVercel = process.env.VERCEL === "1" || process.env.DEPLOY_TARGET === "vercel";
const isProd = process.env.NODE_ENV === "production";
const basePath = onVercel ? "" : (process.env.NEXT_PUBLIC_BASE_PATH ?? (isProd ? "/aitoolpicks" : ""));

// Content-Security-Policy is sent in REPORT-ONLY mode first: it cannot break a page, and the browser console shows what an enforcing policy would block
// (the 3D scene needs blob: workers). Switch the header name to Content-Security-Policy once a week of reports is clean.
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
  { key: "Content-Security-Policy-Report-Only", value: csp },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(onVercel ? {} : { output: "export" }),
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: { root },
  pageExtensions: onVercel ? ["tsx", "ts", "vercel.ts"] : ["tsx", "ts"],
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // The database health route reads the migration journal from ./drizzle at run time, which file tracing cannot see by itself.
  ...(onVercel ? { outputFileTracingIncludes: { "/api/health/db": ["./drizzle/**"] } } : {}),
  ...(onVercel
    ? {
        async redirects() {
          return legacyRedirects(root).map((r) => ({ ...r, permanent: true }));
        },
        async headers() {
          return [
            { source: "/:path*", headers: securityHeaders },
            { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }, { key: "X-Robots-Tag", value: "noindex" }] },
          ];
        },
      }
    : {}),
};

export default nextConfig;
