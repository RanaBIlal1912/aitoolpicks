// The server code and its secrets must stay out of the public website, which is still a static export in this phase.
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (p: string) => fs.readFileSync(path.join(root, p), "utf8");
const walk = (dir: string): string[] =>
  fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));

describe("the public website uses the server code only through the Vercel-only routes", () => {
  // src/app/api/**/route.vercel.ts exist only in the Vercel build (pageExtensions in next.config.mjs); tests/hosting.test.ts checks that no other file under src/app imports server code.
  const vercelOnly = (f: string) => /^src\/app\/api\/.+\/route\.vercel\.ts$/.test(f);
  it("no page, component or library file imports src/server", () => {
    for (const dir of ["src/app", "src/components", "src/lib", "src/data"]) {
      for (const f of walk(dir).filter((x) => /\.(ts|tsx)$/.test(x) && !vercelOnly(x))) {
        expect(read(f), f).not.toMatch(/from ["'](@\/server|(\.\.?\/)+server)\//);
      }
    }
  });

  it("the Next.js entry for the database carries the server-only guard", () => {
    expect(read("src/server/db/server.ts")).toMatch(/^import "server-only";/m);
  });

  it("nothing outside src/server and the command line tools imports the database driver or Drizzle", () => {
    for (const dir of ["src/app", "src/components", "src/lib", "src/data"]) {
      for (const f of walk(dir).filter((x) => /\.(ts|tsx)$/.test(x))) expect(read(f), f).not.toMatch(/from ["'](postgres|drizzle-orm[^"']*|drizzle-kit)["']/);
    }
  });
});

describe("authentication code", () => {
  it("the Next.js entry for authentication carries the server-only guard", () => {
    expect(read("src/server/auth/server.ts")).toMatch(/^import "server-only";/m);
  });

  it("the service-role key is read in one place (the environment schema) and passed to one other (the Supabase provider)", () => {
    const users = walk("src").filter((f) => /\.(ts|tsx)$/.test(f) && /SERVICE_ROLE|serviceRoleKey/.test(read(f)));
    expect(users.sort()).toEqual(["src/server/auth/provider.ts", "src/server/auth/server.ts", "src/server/env.ts"]);
  });

  it("no page, component or library file imports the authentication code or the Supabase service", () => {
    for (const dir of ["src/app", "src/components", "src/lib", "src/data"]) {
      for (const f of walk(dir).filter((x) => /\.(ts|tsx)$/.test(x))) expect(read(f), f).not.toMatch(/server\/auth|@supabase\//);
    }
  });

  it("no Supabase client library is installed (the provider uses fetch)", () => {
    const pkg = JSON.parse(read("package.json")) as { dependencies?: Record<string, string>; devDependencies?: Record<string, string> };
    expect(Object.keys({ ...pkg.dependencies, ...pkg.devDependencies }).filter((n) => n.startsWith("@supabase/"))).toEqual([]);
  });
});

describe("secrets", () => {
  it("no environment variable that holds a secret is exposed to the browser (NEXT_PUBLIC_ prefix)", () => {
    const files = [...walk("src"), ...walk("scripts"), ".env.example", "next.config.mjs", "drizzle.config.ts"].filter((f) => /\.(ts|tsx|mjs|js|example|json)$/.test(f));
    for (const f of files) {
      for (const m of read(f).matchAll(/NEXT_PUBLIC_[A-Z0-9_]+/g)) expect(m[0], `${f}: ${m[0]}`).not.toMatch(/KEY|SECRET|PASSWORD|TOKEN|DATABASE|SERVICE|SALT|HOOK|DSN/);
    }
  });

  it("environment files are git-ignored, with .env.example as the only exception", () => {
    const ignore = read(".gitignore");
    expect(ignore).toMatch(/^\.env\*$/m);
    expect(ignore).toMatch(/^!\.env\.example$/m);
  });

  it("no tracked file contains a connection string with a password, a JWT-style key or a private key", () => {
    const files = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8" }).split("\n").filter(Boolean);
    const skip = (f: string) => /^(tests\/|package-lock\.json$|node_modules\/|out\/|docs\/screenshots\/|public\/)/.test(f) || /\.(png|jpe?g|webp|ico|woff2?|svg)$/.test(f);
    for (const f of files.filter((x) => !skip(x) && fs.existsSync(path.join(root, x)))) {
      const text = read(f);
      expect(text, `${f} has a connection string with a password`).not.toMatch(/postgres(ql)?:\/\/[^:@/\s'"]+:(?!password@|\*\*\*|<)[^@/\s'"]{6,}@/i);
      expect(text, `${f} has a JWT-style key`).not.toMatch(/\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}/);
      expect(text, `${f} has a private key`).not.toMatch(/-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/);
    }
  });
});

// These read the built static site (npm run build first); skipped when out/ does not exist.
const built = fs.existsSync(path.join(root, "out/index.html"));
describe.skipIf(!built)("the built static site", () => {
  it("contains no database setting name, connection string or server module", () => {
    for (const f of walk("out").filter((x) => /\.(html|js|txt|json|css)$/.test(x))) {
      const text = read(f);
      expect(text, f).not.toMatch(/DATABASE_URL|DATABASE_DIRECT_URL|SUPABASE_SERVICE_ROLE_KEY|postgres:\/\/|drizzle-orm|ANALYTICS_SALT/);
    }
  });

  it("still has the same pages as before (320 URLs in the sitemap)", () => {
    const xml = read("out/sitemap.xml");
    expect([...xml.matchAll(/<loc>/g)].length).toBe(320);
  });
});
