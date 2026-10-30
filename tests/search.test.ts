import { describe, expect, it } from "vitest";
import { TOOLS } from "@/data/tools";
import { searchTools } from "@/lib/search";
import { pushRecent, toggleId } from "@/lib/saved";

const top = (q: string, n = 5) => searchTools(q, TOOLS).slice(0, n).map((m) => m.tool.id);

describe("local search", () => {
  it("finds tools by name and company", () => {
    expect(top("cursor")[0]).toBe("cursor");
    expect(top("anthropic")).toContain("claude");
  });

  it("answers the task questions people actually type", () => {
    expect(top("I want to create professional videos", 8).some((id) => ["runway", "synthesia", "heygen", "luma", "pika"].includes(id))).toBe(true);
    expect(top("I need an AI coding assistant", 6).some((id) => ["github-copilot", "cursor"].includes(id))).toBe(true);
    expect(top("I need to transcribe meetings", 6).some((id) => ["otter", "granola", "fireflies", "fathom"].includes(id))).toBe(true);
    expect(top("I want to research academic papers", 6).some((id) => ["elicit", "consensus", "scite"].includes(id))).toBe(true);
    expect(top("I want to create AI voiceovers", 6)).toContain("elevenlabs");
    expect(top("I need to build a website", 8).some((id) => ["hostinger", "lovable", "bolt", "v0", "replit"].includes(id))).toBe(true);
  });

  it("explains every match and returns nothing for gibberish or empty text", () => {
    for (const m of searchTools("image", TOOLS)) expect(m.reasons.length).toBeGreaterThan(0);
    expect(searchTools("", TOOLS)).toEqual([]);
    expect(searchTools("zzzzqqqq", TOOLS)).toEqual([]);
  });
});

describe("saved tools helpers", () => {
  it("toggles without duplicates", () => {
    expect(toggleId([], "a")).toEqual(["a"]);
    expect(toggleId(["a", "b"], "a")).toEqual(["b"]);
  });
  it("keeps the latest view first, without duplicates, within the limit", () => {
    expect(pushRecent(["a", "b", "c"], "b")).toEqual(["b", "a", "c"]);
    expect(pushRecent(["a", "b"], "c", 2)).toEqual(["c", "a"]);
  });
});

import { alternativesFor } from "@/lib/alternatives";
import { findDuplicate, hostOf, issueUrl, validate } from "@/components/SubmitForm";
import { CATEGORIES } from "@/data/tools";

describe("alternatives", () => {
  it("gives reasons for every alternative and never lists the tool itself", () => {
    for (const t of TOOLS) {
      for (const a of alternativesFor(t.id, 12)) {
        expect(a.tool.id).not.toBe(t.id);
        expect(a.reasons.length, `${t.id} -> ${a.tool.id}`).toBeGreaterThan(0);
      }
    }
  });

  it("keeps alternatives related: same category or a curated link", () => {
    for (const t of TOOLS) {
      for (const a of alternativesFor(t.id, 12)) {
        const related = a.curated || a.tool.categories.some((c) => t.categories.includes(c));
        expect(related, `${t.id} -> ${a.tool.id}`).toBe(true);
      }
    }
  });

  it("finds coding-agent peers for Devin and does not offer a domain registrar", () => {
    const ids = alternativesFor("devin").map((a) => a.tool.id);
    expect(ids.some((i) => ["cursor", "github-copilot", "replit"].includes(i))).toBe(true);
    expect(ids).not.toContain("namecheap");
  });
});

describe("submit a tool form rules", () => {
  const ok = { name: "Acme AI", website: "https://acme.example", company: "Acme Inc", category: CATEGORIES[0].slug, description: "Acme AI drafts replies to customer emails automatically.", features: "Drafts replies; tone settings", pricingUrl: "https://acme.example/pricing", email: "", submitter: "", extra: "" };

  it("accepts a complete submission and requires the key fields", () => {
    expect(validate(ok)).toEqual({});
    const e = validate({ ...ok, name: "", website: "http://acme.example", description: "short", pricingUrl: "not a url", email: "nope" });
    expect(Object.keys(e).sort()).toEqual(["description", "email", "name", "pricingUrl", "website"]);
  });

  it("detects a tool that is already listed by website or name", () => {
    expect(findDuplicate({ name: "Something else", website: "https://www.cursor.com/pricing" })?.id).toBe("cursor");
    expect(findDuplicate({ name: "Claude", website: "https://nope.example" })?.id).toBe("claude");
    expect(findDuplicate({ name: "Acme AI", website: "https://acme.example" })).toBeUndefined();
    expect(hostOf("javascript:alert(1)")).toBeNull();
  });

  it("builds a GitHub issue address in this repository with the fields filled in", () => {
    const u = new URL(issueUrl(ok));
    expect(u.hostname).toBe("github.com");
    expect(u.pathname).toMatch(/\/issues\/new$/);
    expect(u.searchParams.get("template")).toBe("submit-tool.yml");
    expect(u.searchParams.get("tool-name")).toBe("Acme AI");
  });
});

describe("search ranking details", () => {
  it("puts coding tools before general chat assistants for a coding-assistant query", () => {
    const ids = top("I need an AI coding assistant", 4);
    expect(ids.some((i) => ["github-copilot", "cursor", "devin"].includes(i))).toBe(true);
    expect(ids[0]).not.toBe("mistral");
  });
});
