// Columns every editable content table carries (docs/platform/02-database.md section 1): editorial status, soft delete, authorship, timestamps.
import { sql } from "drizzle-orm";
import { check, timestamp } from "drizzle-orm/pg-core";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { createdAt, fkCol, SLUG_PATTERN, updatedAt } from "./columns.ts";
import { contentStatus } from "./enums.ts";
import { teamMembers } from "./team.ts";

export const contentColumns = () => ({
  status: contentStatus("status").notNull().default("draft"),
  /** Soft delete. Rows with a value here never reach the public snapshot. */
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
  /** Set when status becomes published; the public snapshot orders and dates content by it. */
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdBy: fkCol("created_by").references((): AnyPgColumn => teamMembers.id, { onDelete: "set null" }),
  updatedBy: fkCol("updated_by").references((): AnyPgColumn => teamMembers.id, { onDelete: "set null" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

/** CHECK that a slug has the allowed shape. */
export const slugFormat = (table: string, col: AnyPgColumn) => check(`${table}_slug_format`, sql`${col} ~ ${sql.raw(`'${SLUG_PATTERN}'`)}`);
/** CHECK that a published row says when it was published. */
export const publishedHasDate = (table: string, status: AnyPgColumn, publishedAt: AnyPgColumn) =>
  check(`${table}_published_has_date`, sql`${status} <> 'published' or ${publishedAt} is not null`);
