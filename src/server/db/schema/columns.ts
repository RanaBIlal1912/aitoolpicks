// Small column builders shared by every table, so the conventions in docs/platform/02-database.md are written once.
import { bigint, text, timestamp } from "drizzle-orm/pg-core";

/** bigint identity primary key. */
export const pk = () => bigint("id", { mode: "number" }).primaryKey().generatedAlwaysAsIdentity();

/** A bigint foreign-key column (the reference is added where the table is defined). */
export const fkCol = (name: string) => bigint(name, { mode: "number" });

export const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
export const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

/** Lowercase letters, digits and single hyphens. Every slug and id used in URLs today matches this (checked on the real data). */
export const SLUG_PATTERN = "^[a-z0-9]+(-[a-z0-9]+)*$";
/** An https address with a host that has a dot. */
export const HTTPS_PATTERN = "^https://[^/ ]+\\.[^/ ]+";

export const slug = () => text("slug").notNull();
