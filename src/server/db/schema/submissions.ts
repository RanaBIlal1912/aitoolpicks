// Tool submissions and the decisions taken on them (docs/platform/02-database.md section 3.6).
import { sql } from "drizzle-orm";
import { check, index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { fkCol, HTTPS_PATTERN, pk } from "./columns.ts";
import { submissionDecisionKind, submissionSource, submissionStatus } from "./enums.ts";
import { categories, tools } from "./catalogue.ts";
import { teamMembers } from "./team.ts";

const https = (col: unknown) => sql`${col} ~ ${sql.raw(`'${HTTPS_PATTERN}'`)}`;

export const toolSubmissions = pgTable(
  "tool_submissions",
  {
    id: pk(),
    /** What the submitter is shown; the numeric id is never exposed. */
    publicId: uuid("public_id").notNull().defaultRandom(),
    name: text("name").notNull(),
    websiteUrl: text("website_url").notNull(),
    /** Normalised host (lowercase, no "www."), used for duplicate detection. */
    websiteHost: text("website_host").notNull(),
    company: text("company").notNull(),
    categoryId: fkCol("category_id").references(() => categories.id, { onDelete: "set null" }),
    description: text("description").notNull(),
    features: text("features").notNull(),
    pricingUrl: text("pricing_url").notNull(),
    submitterName: text("submitter_name"),
    /** Optional, never shown publicly. */
    contactEmail: text("contact_email"),
    status: submissionStatus("status").notNull().default("new"),
    source: submissionSource("source").notNull().default("web"),
    duplicateOfToolId: fkCol("duplicate_of_tool_id").references(() => tools.id, { onDelete: "set null" }),
    resultingToolId: fkCol("resulting_tool_id").references(() => tools.id, { onDelete: "set null" }),
    ipHash: text("ip_hash"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("tool_submissions_public_id_key").on(t.publicId),
    // One open submission per website host. A rejected, duplicate or spam row does not block a corrected resubmission.
    uniqueIndex("tool_submissions_open_host_key").on(t.websiteHost).where(sql`${t.status} in ('new', 'in_review', 'approved')`),
    index("tool_submissions_status_idx").on(t.status, t.createdAt.desc()),
    check("tool_submissions_website_https", https(t.websiteUrl)),
    check("tool_submissions_pricing_https", https(t.pricingUrl)),
    check("tool_submissions_host_normalised", sql`${t.websiteHost} = lower(${t.websiteHost}) and ${t.websiteHost} !~ '^www\\.' and ${t.websiteHost} ~ '\\.'`),
    check("tool_submissions_lengths", sql`length(btrim(${t.name})) between 2 and 120 and length(${t.description}) between 30 and 4000 and length(${t.features}) between 10 and 4000`),
    check("tool_submissions_email_format", sql`${t.contactEmail} is null or ${t.contactEmail} ~ '^[^@\\s]+@[^@\\s]+\\.[^@\\s]{2,}$'`),
    check("tool_submissions_duplicate_target", sql`${t.status} <> 'duplicate' or ${t.duplicateOfToolId} is not null`),
  ],
);

/** Internal. The submitter never sees these notes. */
export const submissionDecisions = pgTable(
  "submission_decisions",
  {
    id: pk(),
    submissionId: fkCol("submission_id").notNull().references(() => toolSubmissions.id, { onDelete: "cascade" }),
    decision: submissionDecisionKind("decision").notNull(),
    decidedBy: fkCol("decided_by").references(() => teamMembers.id, { onDelete: "set null" }),
    internalNote: text("internal_note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("submission_decisions_submission_idx").on(t.submissionId, t.createdAt.desc())],
);
