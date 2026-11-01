import { afterEach, describe, expect, it, vi } from "vitest";

type Mod = typeof import("@/lib/analytics");

/** A browser stand-in: just enough window, document, navigator and storage to run the consent code in Node. */
function browser(opts: { stored?: string; gpc?: boolean; dnt?: boolean; storageThrows?: boolean; host?: string } = {}) {
  const cookies: string[] = [];
  const scripts: { src?: string }[] = [];
  const store = new Map<string, string>(opts.stored ? [["aitp-consent", opts.stored]] : []);
  const win: Record<string, unknown> = {};
  vi.stubGlobal("window", win);
  vi.stubGlobal("navigator", { globalPrivacyControl: opts.gpc, doNotTrack: opts.dnt ? "1" : null });
  vi.stubGlobal("location", { hostname: opts.host ?? "ranabilal1912.github.io", pathname: "/aitoolpicks/", search: "", href: "https://ranabilal1912.github.io/aitoolpicks/" });
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => {
      if (opts.storageThrows) throw new Error("blocked");
      return store.get(k) ?? null;
    },
    setItem: (k: string, v: string) => {
      if (opts.storageThrows) throw new Error("blocked");
      store.set(k, v);
    },
  });
  vi.stubGlobal("document", {
    title: "Home",
    set cookie(v: string) {
      cookies.push(v);
    },
    createElement: () => ({}) as { src?: string },
    head: { appendChild: (s: { src?: string }) => scripts.push(s) },
  });
  return { cookies, scripts, store, win };
}

/** `gates` are the other three things analytics needs: operator name, private contact and the owner's sign-off. */
const ALL_GATES = { NEXT_PUBLIC_OPERATOR_NAME: "Test Operator", NEXT_PUBLIC_PRIVACY_CONTACT: "privacy@example.test", NEXT_PUBLIC_ANALYTICS_APPROVED: "yes" };

async function load(id: string | undefined, base = "/aitoolpicks", gates: Record<string, string> = ALL_GATES): Promise<Mod> {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_BASE_PATH", base);
  if (id !== undefined) vi.stubEnv("NEXT_PUBLIC_GA_ID", id);
  for (const [k, v] of Object.entries(gates)) vi.stubEnv(k, v);
  return import("@/lib/analytics");
}

const ID = "G-ABC123XYZ9";
const calls = (win: Record<string, unknown>) => ((win.dataLayer as unknown[]) ?? []).map((a) => Array.from(a as ArrayLike<unknown>));

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("analytics is off unless configured", () => {
  it("needs a valid measurement ID at build time", async () => {
    expect((await load(undefined)).ANALYTICS_ENABLED).toBe(false);
    for (const bad of ["", "abc", "UA-12345-1", "G-"]) expect((await load(bad)).ANALYTICS_ENABLED).toBe(false);
    expect((await load(ID)).ANALYTICS_ENABLED).toBe(true);
  });

  it("cannot go live from the measurement ID alone: it also needs the operator's name, a private contact and the owner's sign-off", async () => {
    expect((await load(ID, "/aitoolpicks", {})).ANALYTICS_ENABLED).toBe(false);
    for (const missing of Object.keys(ALL_GATES)) {
      const gates = { ...ALL_GATES, [missing]: "" };
      expect((await load(ID, "/aitoolpicks", gates)).ANALYTICS_ENABLED).toBe(false);
    }
    // Sign-off must be exactly "yes".
    expect((await load(ID, "/aitoolpicks", { ...ALL_GATES, NEXT_PUBLIC_ANALYTICS_APPROVED: "true" })).ANALYTICS_ENABLED).toBe(false);
    // Spaces alone are not a name or a contact.
    expect((await load(ID, "/aitoolpicks", { ...ALL_GATES, NEXT_PUBLIC_OPERATOR_NAME: "   " })).ANALYTICS_ENABLED).toBe(false);
  });

  it("never loads Google's script or sends anything when disabled, whatever the stored choice", async () => {
    const b = browser({ stored: `granted|${Date.now()}` });
    const m = await load(undefined);
    m.loadGa();
    m.setConsent("granted");
    m.pageView();
    m.track("outbound_click", { tool: "x", kind: "official" });
    expect(b.scripts).toHaveLength(0);
    expect(b.win.gtag).toBeUndefined();
    expect(b.win.dataLayer).toBeUndefined();
  });
});

describe("consent", () => {
  it("asks first: nothing loads until the visitor allows it", async () => {
    const b = browser();
    const m = await load(ID);
    expect(m.readConsent()).toBeNull();
    m.pageView();
    m.track("outbound_click", { tool: "x", kind: "official" });
    expect(b.scripts).toHaveLength(0);
    expect(b.win.gtag).toBeUndefined();
  });

  it("loads Google's tag once, after Allow, with ads features off and cookies kept to this site's path", async () => {
    const b = browser();
    const m = await load(ID);
    expect(m.setConsent("granted")).toBe(false);
    m.loadGa();
    expect(b.scripts).toHaveLength(1);
    expect(b.scripts[0].src).toBe(`https://www.googletagmanager.com/gtag/js?id=${ID}`);
    const cfg = calls(b.win).find((c) => c[0] === "config");
    expect(cfg?.[1]).toBe(ID);
    expect(cfg?.[2]).toMatchObject({ send_page_view: false, cookie_path: "/aitoolpicks", allow_google_signals: false, allow_ad_personalization_signals: false });
    expect(calls(b.win).find((c) => c[0] === "consent")?.[2]).toMatchObject({ ad_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
    expect(b.store.get("aitp-consent")).toMatch(/^granted\|\d+$/);
  });

  it("sends one page view per page (path), and custom events, only while allowed", async () => {
    const b = browser();
    const m = await load(ID);
    m.setConsent("granted");
    const views = () => calls(b.win).filter((c) => c[0] === "event" && c[1] === "page_view");
    m.pageView();
    m.pageView();
    expect(views()).toHaveLength(1);
    // A query-only change is the same page.
    (location as unknown as { search: string }).search = "?ids=a,b";
    m.pageView();
    expect(views()).toHaveLength(1);
    // A new path is a new page, and going back to an earlier one counts again.
    (location as unknown as { pathname: string }).pathname = "/aitoolpicks/tools/";
    m.pageView();
    (location as unknown as { pathname: string }).pathname = "/aitoolpicks/";
    m.pageView();
    expect(views()).toHaveLength(3);
    m.track("outbound_click", { tool: "claude", kind: "affiliate", placement: "hero" });
    expect(calls(b.win).some((c) => c[1] === "outbound_click" && (c[2] as { tool: string }).tool === "claude")).toBe(true);
  });

  it("No thanks first: nothing loads and no reload is needed", async () => {
    const b = browser();
    const m = await load(ID);
    expect(m.setConsent("denied")).toBe(false);
    expect(b.scripts).toHaveLength(0);
    expect(m.readConsent()).toBe("denied");
  });

  it("No thanks after Allow: stops, clears only this site's cookies, and asks for a reload", async () => {
    const b = browser();
    const m = await load(ID);
    m.setConsent("granted");
    const before = calls(b.win).length;
    expect(m.setConsent("denied")).toBe(true);
    expect(b.win[`ga-disable-${ID}`]).toBe(true);
    m.pageView();
    m.track("outbound_click", { tool: "x", kind: "official" });
    expect(calls(b.win)).toHaveLength(before);
    expect(b.cookies.some((c) => c.startsWith("_ga=; expires=Thu, 01 Jan 1970"))).toBe(true);
    expect(b.cookies.some((c) => c.startsWith("_ga_ABC123XYZ9="))).toBe(true);
    // Never "/": project sites on one github.io origin share it, and other sites' cookies must be left alone.
    expect(b.cookies.every((c) => c.includes("path=/aitoolpicks"))).toBe(true);
  });

  it("clears cookies whatever domain scope Google gave them (custom domain)", async () => {
    const b = browser({ host: "www.example.com" });
    const m = await load(ID, "");
    m.expireGaCookies();
    for (const d of [null, "www.example.com", ".www.example.com", "example.com", ".example.com"])
      expect(b.cookies.some((c) => c.startsWith("_ga=;") && c.includes("path=/") && (d ? c.endsWith(`domain=${d}`) : !c.includes("domain=")))).toBe(true);
  });

  it("honours Global Privacy Control and Do Not Track even over a stored yes", async () => {
    for (const o of [{ gpc: true }, { dnt: true }]) {
      browser({ ...o, stored: `granted|${Date.now()}` });
      expect((await load(ID)).readConsent()).toBe("denied");
    }
  });

  it("asks again after 13 months, and ignores damaged values", async () => {
    const day = 24 * 3600 * 1000;
    browser({ stored: `granted|${Date.now() - 394 * day}` });
    expect((await load(ID)).readConsent()).toBe("granted");
    browser({ stored: `granted|${Date.now() - 396 * day}` });
    expect((await load(ID)).readConsent()).toBeNull();
    for (const bad of ["granted", "yes|1", "granted|abc", "|"]) {
      browser({ stored: bad });
      expect((await load(ID)).readConsent()).toBeNull();
    }
  });

  it("survives blocked storage", async () => {
    const b = browser({ storageThrows: true });
    const m = await load(ID);
    expect(m.readConsent()).toBeNull();
    expect(() => m.setConsent("granted")).not.toThrow();
    expect(b.scripts).toHaveLength(1);
  });
});
