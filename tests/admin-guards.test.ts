// The development sign-in provider must never be usable anywhere real, and it must behave like a real provider for the admin app's flows.
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assertDevProviderAllowed, DEV_PASSWORD, InMemoryProvider } from "../src/server/auth/dev-provider.ts";

const LOCAL = "postgres://postgres@127.0.0.1:5432/app";
const ok = { NODE_ENV: "development", AUTH_DEV_PROVIDER: "1", DATABASE_URL: LOCAL };

describe("assertDevProviderAllowed", () => {
  it("allows only development, with the flag, on a local database", () => {
    expect(() => assertDevProviderAllowed(ok)).not.toThrow();
    expect(() => assertDevProviderAllowed({ ...ok, DATABASE_URL: "postgres://u@localhost:5432/x" })).not.toThrow();
  });

  it("refuses production, a missing flag, a hosted database and a bad URL", () => {
    expect(() => assertDevProviderAllowed({ ...ok, NODE_ENV: "production" })).toThrow(/production/);
    expect(() => assertDevProviderAllowed({ ...ok, AUTH_DEV_PROVIDER: undefined })).toThrow(/AUTH_DEV_PROVIDER/);
    expect(() => assertDevProviderAllowed({ ...ok, AUTH_DEV_PROVIDER: "true" })).toThrow(/AUTH_DEV_PROVIDER/);
    expect(() => assertDevProviderAllowed({ ...ok, DATABASE_URL: "postgres://u:p@db.abcd.supabase.co:5432/postgres" })).toThrow(/this computer/);
    expect(() => assertDevProviderAllowed({ ...ok, DATABASE_URL: "not a url" })).toThrow(/this computer/);
    expect(() => assertDevProviderAllowed({ ...ok, DATABASE_URL: undefined })).toThrow(/this computer/);
  });
});

describe("InMemoryProvider", () => {
  it("signs in with the right password only, case-insensitively on the address", async () => {
    const p = new InMemoryProvider();
    p.addUser("Ana@Example.com");
    expect(await p.signInWithPassword("ana@example.com", "wrong")).toBeNull();
    expect(await p.signInWithPassword("nobody@example.com", DEV_PASSWORD)).toBeNull();
    const s = await p.signInWithPassword("ANA@example.com", DEV_PASSWORD);
    expect(s?.accessToken).toBeTruthy();
    expect((await p.verifyAccessToken(s!.accessToken))?.email).toBe("ana@example.com");
  });

  it("an expired or signed-out token stops working, and a refresh token works once", async () => {
    const p = new InMemoryProvider();
    p.addUser("ana@example.com");
    const s = (await p.signInWithPassword("ana@example.com", DEV_PASSWORD))!;
    p.expire(s.accessToken);
    expect(await p.verifyAccessToken(s.accessToken)).toBeNull();
    const next = (await p.refreshSession(s.refreshToken))!;
    expect(next.accessToken).not.toBe(s.accessToken);
    expect(await p.refreshSession(s.refreshToken)).toBeNull();
    await p.signOut(next.accessToken);
    expect(await p.verifyAccessToken(next.accessToken)).toBeNull();
  });

  it("a blocked user cannot sign in, refresh or use a token they already have", async () => {
    const p = new InMemoryProvider();
    const id = p.addUser("ana@example.com");
    const s = (await p.signInWithPassword("ana@example.com", DEV_PASSWORD))!;
    await p.setBanned(id, true);
    expect(await p.verifyAccessToken(s.accessToken)).toBeNull();
    expect(await p.refreshSession(s.refreshToken)).toBeNull();
    expect(await p.signInWithPassword("ana@example.com", DEV_PASSWORD)).toBeNull();
    await p.setBanned(id, false);
    expect(await p.signInWithPassword("ana@example.com", DEV_PASSWORD)).not.toBeNull();
  });

  it("changes a password only for a valid session and only to a long enough one", async () => {
    const p = new InMemoryProvider();
    p.addUser("ana@example.com");
    const s = (await p.signInWithPassword("ana@example.com", DEV_PASSWORD))!;
    expect(await p.updatePassword("bogus", "long-enough-password")).toBe(false);
    expect(await p.updatePassword(s.accessToken, "short")).toBe(false);
    expect(await p.updatePassword(s.accessToken, "long-enough-password")).toBe(true);
    expect(await p.signInWithPassword("ana@example.com", DEV_PASSWORD)).toBeNull();
    expect(await p.signInWithPassword("ana@example.com", "long-enough-password")).not.toBeNull();
  });
});

describe("the admin app", () => {
  const root = process.cwd();
  const walk = (dir: string): string[] =>
    fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => (e.name === ".next" || e.name === "node_modules" ? [] : e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`]));
  const files = walk("admin").filter((f) => /\.(ts|tsx|mjs|css)$/.test(f));
  const read = (f: string) => fs.readFileSync(path.join(root, f), "utf8");

  it("has no NEXT_PUBLIC_ variable and does not read a secret in a client component", () => {
    for (const f of files) {
      const text = read(f);
      expect(text, f).not.toMatch(/NEXT_PUBLIC_/);
      if (/^\s*"use client"/.test(text)) expect(text, f).not.toMatch(/process\.env|src\/server|SERVICE_ROLE/);
    }
  });

  it("every page and action asks for a signed-in member before it reads or writes", () => {
    const pages = files.filter((f) => /\/(page|route)\.tsx?$/.test(f) && !/(login|denied|unavailable|refresh)/.test(f));
    expect(pages.length).toBeGreaterThanOrEqual(15);
    for (const f of pages) expect(read(f), f).toMatch(/requirePage\(/);
    const actions = read("admin/app/(console)/actions.ts");
    const exported = [...actions.matchAll(/export async function (\w+)/g)].map((m) => m[1]);
    expect(exported.length).toBeGreaterThanOrEqual(5);
    for (const name of exported) {
      const body = actions.slice(actions.indexOf(`export async function ${name}`)).split(/\nexport async function /)[0];
      expect(body, name).toMatch(/requirePage\(/);
    }
  });

  it("the sign-in cookies are HttpOnly, SameSite and secure in production", () => {
    const s = read("admin/lib/session.ts");
    expect(s).toMatch(/httpOnly: true/);
    expect(s).toMatch(/sameSite: "lax"/);
    expect(s).toMatch(/secure/);
  });

  it("sends no-store, frame and robots protections on every response", () => {
    const c = read("admin/next.config.mjs");
    for (const h of ["no-store", "X-Frame-Options", "nosniff", "noindex"]) expect(c).toContain(h);
  });
});
