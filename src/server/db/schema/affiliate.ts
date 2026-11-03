// Affiliate programmes, applications and links (docs/platform/02-database.md section 3.5). Mirrors content/affiliate.json and its rule:
// a link is only ever used while the programme is approved.
import { sql } from "drizzle-orm";
import { check, date, index, pgTable, text, timestamp, unique } from "drizzle-orm/pg-core";
import { fkCol, HTTPS_PATTERN, pk } from "./columns.ts";
import { affiliateStatus, applicationStatus } from "./enums.ts";
import { tools } from "./catalogue.ts";
import { teamMembers } from "./team.ts";

const https = (col: unknown) => sql`${col} ~ ${sql.raw(`'${HTTPS_PATTERN}'`)}`;

export const affiliatePrograms = pgTable(
  "affiliate_programs",
  {
    id: pk(),
    /** One programme record per tool, as in affiliate.json. */
    toolId: fkCol("tool_id").notNull().references(() => tools.id, { onDelete: "cascade" }),
    status: affiliateStatus("status").notNull().default("ordinary"),
    network: text("network"),
    applyUrl: text("apply_url"),
    termsUrl: text("terms_url"),
    sourceUrl: text("source_url"),
    checkedAt: date("checked_at"),
    note: text("note"),
    /** Text shown beside affiliate buttons when the programme is approved. */
    disclosureText: text("disclosure_text"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    updatedBy: fkCol("updated_by").references(() => teamMembers.id, { onDelete: "set null" }),
  },
  (t) => [
    unique("affiliate_programs_tool_key").on(t.toolId),
    index("affiliate_programs_status_idx").on(t.status),
    check("affiliate_programs_apply_https", sql`${t.applyUrl} is null or ${https(t.applyUrl)}`),
    check("affiliate_programs_terms_https", sql`${t.termsUrl} is null or ${https(t.termsUrl)}`),
    check("affiliate_programs_source_https", sql`${t.sourceUrl} is null or ${https(t.sourceUrl)}`),
    // "unavailable" must say why and cite the programme's own page, as the existing tests require.
    check("affiliate_programs_unavailable_cited", sql`${t.status} <> 'unavailable' or (${t.sourceUrl} is not null and length(btrim(coalesce(${t.note}, ''))) > 20)`),
  ],
);

/** What actually happened with an application. A human decision here is what moves a programme to approved or unavailable. */
export const affiliateApplications = pgTable(
  "affiliate_applications",
  {
    id: pk(),
    programId: fkCol("program_id").notNull().references(() => affiliatePrograms.id, { onDelete: "cascade" }),
    status: applicationStatus("status").notNull().default("draft"),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
    appliedBy: fkCol("applied_by").references(() => teamMembers.id, { onDelete: "set null" }),
    notes: text("notes").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("affiliate_applications_program_idx").on(t.programId, t.createdAt.desc()),
    check("affiliate_applications_submitted_dated", sql`${t.status} not in ('submitted', 'approved', 'rejected') or ${t.submittedAt} is not null`),
    check("affiliate_applications_decided_dated", sql`${t.status} not in ('approved', 'rejected') or ${t.decidedAt} is not null`),
  ],
);

/** The tracked URL a programme gave us. A trigger refuses a link unless its programme is approved. */
export const affiliateLinks = pgTable(
  "affiliate_links",
  {
    id: pk(),
    programId: fkCol("program_id").notNull().references(() => affiliatePrograms.id, { onDelete: "cascade" }),
    /** Two-letter country code, or "default". */
    countryCode: text("country_code").notNull().default("default"),
    url: text("url").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    unique("affiliate_links_program_country_key").on(t.programId, t.countryCode),
    check("affiliate_links_country_format", sql`${t.countryCode} = 'default' or ${t.countryCode} ~ '^[A-Z]{2}$'`),
    check("affiliate_links_url_https", https(t.url)),
  ],
);
