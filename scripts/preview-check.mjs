// Click-through check of the home page against the local preview (node scripts/preview.mjs). Needs puppeteer-core and chrome-launcher resolvable from PUPPETEER_PATH or ./node_modules.
import { createRequire } from "node:module";
const require = createRequire(process.env.PUPPETEER_PATH || process.cwd() + "/node_modules/");
const puppeteer = require("puppeteer-core"); const { Launcher } = require("chrome-launcher");
const U = "http://localhost:8124/aitoolpicks"; const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: Launcher.getFirstInstallation(), headless: "new", protocolTimeout: 120000, args: ["--no-sandbox"] });
const p = await b.newPage(); await p.setViewport({ width: 1440, height: 900 });
const errs = []; p.on("pageerror", (e) => errs.push(String(e).slice(0, 90))); p.on("console", (m) => m.type() === "error" && errs.push(m.text().slice(0, 90)));
const res = []; const ok = (name, pass, extra = "") => { res.push(pass); console.log((pass ? "PASS " : "FAIL ") + name + (extra ? " | " + extra : "")); };
const go = async (path) => { await p.goto(U + path, { waitUntil: "load" }); await wait(1200); };
const path = () => new URL(p.url()).pathname.replace("/aitoolpicks", "") + new URL(p.url()).search;
const clickText = async (sel, re) => { const h = await p.evaluateHandle((sel, re) => [...document.querySelectorAll(sel)].find((e) => new RegExp(re, "i").test(e.textContent.trim())), sel, re.source ?? re); const el = h.asElement(); if (!el) return false; await el.evaluate((e) => e.scrollIntoView({ block: "center" })); await Promise.all([p.waitForNavigation({ timeout: 8000 }).catch(() => {}), el.click()]); await wait(900); return true; };

await go("/");
// 1. every internal link on the home page resolves
const hrefs = await p.evaluate(() => [...new Set([...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).filter((h) => h.startsWith("/aitoolpicks")))]);
const bad = []; for (const h of hrefs) { const r = await p.evaluate(async (h) => (await fetch(h.split("#")[0], { method: "HEAD" })).status, h); if (r !== 200) bad.push(h + " " + r); }
ok(`home: ${hrefs.length} distinct internal links all return 200`, bad.length === 0, bad.join(", "));
// 2. numbers on the pages
const nums = {};
for (const [k, path_, re] of [["home strip", "/", /(\d+)\s*AI tools[\s\S]{0,40}?(\d+)\s*Categories[\s\S]{0,40}?(\d+)\s*Verified prices/i], ["tools banner", "/tools/", /(\d+) tools across (\d+) categories[\s\S]*?fully verified for (\d+)/i], ["pricing", "/pricing/", /Prices for (\d+) tools[\s\S]*?(\d+) are fully verified/i]]) { await go(path_); const t = await p.evaluate(() => document.body.innerText.replace(/\s+/g, " ")); const m = t.match(re); nums[k] = m ? m.slice(1, 4).join("/") : "no match"; }
await go("/tools/"); await wait(2000); const dirCount = await p.evaluate(() => [...document.querySelectorAll("[role=status]")].map((e) => e.textContent.trim()).find((t) => /in the directory/.test(t))); nums["directory list"] = dirCount;
console.log("counts:", JSON.stringify(nums));
ok("same tool/category/verified numbers on home, directory banner and pricing", nums["home strip"] === nums["tools banner"] && nums["pricing"] === nums["home strip"].split("/")[0] + "/" + nums["home strip"].split("/")[2] && /\(69 in the directory\)/.test(nums["directory list"] ?? ""));
// 3. navigation
await go("/");
for (const label of ["Blog", "AI News", "Tools", "Reviews", "Compare", "Pricing", "Home"]) { await go(label === "Home" ? "/blog/" : "/"); const f = await clickText("header nav a", new RegExp("^" + label + "$")); ok(`nav: ${label}`, f && (await p.evaluate(() => document.querySelectorAll("h1").length)) === 1, path()); }
await go("/"); await p.click("header nav button[aria-controls=more-menu]"); await wait(300); ok("nav: More menu opens", (await p.$$("#more-menu a")).length >= 6, (await p.$$("#more-menu a")).length + " links");
await clickText("#more-menu a", /Methodology/); ok("nav: More > Methodology", path().includes("methodology"), path());
// 4. hero buttons and search
await go("/"); await clickText("main a", /Explore Tools/); ok("hero: Explore Tools", path() === "/tools/", path());
await go("/"); await clickText("main a", /Compare Prices/); ok("hero: Compare Prices", path().startsWith("/compare/"), path());
await go("/"); await p.type("input[type=search], input[type=text], input:not([type])", "video"); await Promise.all([p.waitForNavigation({ timeout: 8000 }).catch(() => {}), p.keyboard.press("Enter")]); await wait(1500);
const resCount = await p.evaluate(() => document.body.innerText.match(/(\d+) of (\d+) tools/)?.[0]); ok("search: 'video' goes to the directory with filtered results", path().includes("q=") && !/^69 of 69/.test(resCount ?? ""), path() + " " + resCount);
await go("/"); await clickText("main a, main button", /Create videos/); await wait(800); ok("popular search chip", /tools\/\?q=|\/tools\//.test(path()), path());
// 5. categories, featured, news, blog, cta
await go("/"); const tile = await p.$(".cat-tile"); const tileName = await tile.evaluate((e) => e.textContent.trim().slice(0, 20)); await Promise.all([p.waitForNavigation().catch(() => {}), tile.click()]); await wait(800); ok(`category tile (${tileName})`, path().startsWith("/tools/category/") && (await p.evaluate(() => document.querySelectorAll(".tool-card").length)) > 0, path());
let n = 0; for (let i = 0; i < 6; i++) { await go("/"); const btns = await p.$$("section[aria-label='Featured tools'] a.btn-primary"); await Promise.all([p.waitForNavigation().catch(() => {}), btns[i].click()]); await wait(500); if (/^\/tools\/[a-z0-9-]+\/$/.test(path()) && (await p.evaluate(() => document.querySelectorAll("h1").length)) === 1) n++; }
ok("featured tools: 6 of 6 'View details' open their tool page", n === 6, n + "/6");
await go("/"); const newsLinks = await p.$$eval("main a[href*='/news/']", (a) => a.map((x) => x.getAttribute("href"))); await go("/"); const nl = (await p.$$("main a[href*='/news/']:not([href$='/news/'])"))[0]; await Promise.all([p.waitForNavigation().catch(() => {}), nl.click()]); ok("news panel story opens", /\/news\/.+/.test(path()), path());
await go("/"); const bl = await p.$("main a[href*='/blog/']:not([href$='/blog/'])"); await Promise.all([p.waitForNavigation().catch(() => {}), bl.click()]); ok("blog panel article opens", /\/blog\/.+\//.test(path()), path());
await go("/"); await clickText("main a", /Start exploring now/); ok("promo CTA", path() === "/tools/", path());
// 6. directory tool card, footer
await go("/tools/"); const card = await p.$(".tool-card-link"); await Promise.all([p.waitForNavigation().catch(() => {}), card.click()]); ok("directory tool card opens detail", /^\/tools\/[a-z0-9-]+\/$/.test(path()), path());
await go("/"); const fl = await p.$$eval("footer a", (a) => a.map((x) => x.getAttribute("href")).filter((h) => h.startsWith("/aitoolpicks"))); const fbad = []; for (const h of fl) { const r = await p.evaluate(async (h) => (await fetch(h, { method: "HEAD" })).status, h); if (r !== 200) fbad.push(h); } ok(`footer: ${fl.length} internal links return 200`, fbad.length === 0, fbad.join(","));
ok("no console or page errors during the whole run", errs.length === 0, [...new Set(errs)].join(" | "));
await b.close(); console.log(res.filter(Boolean).length + "/" + res.length + " checks passed");
