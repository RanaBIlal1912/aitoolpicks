// Team members, roles, permissions, the audit log and content revisions (docs/platform/02-database.md section 3.7).
import { sql } from "drizzle-orm";
import { bigint, boolean, check, index, integer, jsonb, pgTable, primaryKey, text, timestamp, unique, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createdAt, fkCol, pk, updatedAt } from "./columns.ts";
import { memberStatus, revisionState } from "./enums.ts";

export const roles = pgTable(
  "roles",
  {
    id: pk(),
    key: text("key").notNull(),
    label: text("label").notNull(),
    /** System roles (owner, admin, editor, reviewer, analyst, contributor) cannot be deleted. */
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: createdAt(),
  },
  (t) => [unique("roles_key_key").on(t.key), check("roles_key_format", sql`${t.key} ~ '^[a-z][a-z_]*$'`)],
);

export const permissions = pgTable(
  "permissions",
  {
    id: pk(),
    /** resource:action, for example tools:publish */
    key: text("key").notNull(),
    description: text("description").notNull().default(""),
  },
  (t) => [unique("permissions_key_key").on(t.key), check("permissions_key_format", sql`${t.key} ~ '^[a-z_]+:[a-z_*]+$'`)],
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: fkCol("role_id").notNull().references(() => roles.id, { onDelete: "cascade" }),
    permissionId: fkCol("permission_id").notNull().references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.roleId, t.permissionId] }), index("role_permissions_permission_idx").on(t.permissionId)],
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: pk(),
    /** The Supabase Auth user. Null until the invitation is accepted. */
    authUserId: uuid("auth_user_id"),
    email: text("email").notNull(),
    displayName: text("display_name").notNull().default(""),
    roleId: fkCol("role_id").notNull().references(() => roles.id, { onDelete: "restrict" }),
    status: memberStatus("status").notNull().default("invited"),
    invitedBy: fkCol("invited_by"),
    invitedAt: timestamp("invited_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    disabledAt: timestamp("disabled_at", { withTimezone: true }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("team_members_email_key").on(sql`lower(${t.email})`),
    uniqueIndex("team_members_auth_user_key").on(t.authUserId).where(sql`${t.authUserId} is not null`),
    index("team_members_role_idx").on(t.roleId),
    check("team_members_email_format", sql`${t.email} ~ '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$'`),
    check("team_members_disabled_consistent", sql`(${t.status} = 'disabled') = (${t.disabledAt} is not null)`),
  ],
);

/** Append-only. Triggers refuse UPDATE, DELETE and TRUNCATE; the application role only gets INSERT and SELECT. */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: pk(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    actorMemberId: bigint("actor_member_id", { mode: "number" }).references(() => teamMembers.id, { onDelete: "restrict" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull().default(""),
    entityId: text("entity_id").notNull().default(""),
    /** Never contains secrets, passwords or tokens. */
    before: jsonb("before"),
    after: jsonb("after"),
    requestId: text("request_id"),
    ipHash: text("ip_hash"),
  },
  (t) => [
    index("audit_logs_time_idx").on(t.occurredAt.desc()),
    index("audit_logs_actor_idx").on(t.actorMemberId, t.occurredAt.desc()),
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    check("audit_logs_action_format", sql`${t.action} ~ '^[a-z_]+(\\.[a-z_]+)+$'`),
  ],
);

/** Optional (decision D-14): drafts, submitted changes and approvals, used for previews and the two-person rule. */
export const contentRevisions = pgTable(
  "content_revisions",
  {
    id: pk(),
    entityType: text("entity_type").notNull(),
    entityId: fkCol("entity_id").notNull(),
    revision: integer("revision").notNull(),
    data: jsonb("data").notNull(),
    state: revisionState("state").notNull().default("draft"),
    requiresSecondPerson: boolean("requires_second_person").notNull().default(false),
    createdBy: fkCol("created_by").references(() => teamMembers.id, { onDelete: "set null" }),
    approvedBy: fkCol("approved_by").references(() => teamMembers.id, { onDelete: "set null" }),
    createdAt: createdAt(),
    decidedAt: timestamp("decided_at", { withTimezone: true }),
  },
  (t) => [
    unique("content_revisions_entity_revision_key").on(t.entityType, t.entityId, t.revision),
    index("content_revisions_state_idx").on(t.state, t.createdAt.desc()),
    check("content_revisions_revision_positive", sql`${t.revision} >= 1`),
    check("content_revisions_approver_present", sql`${t.state} <> 'approved' or ${t.approvedBy} is not null`),
    // When the change needs a second person (sensitive fields and two or more people can publish, decision D-06) the approver must be someone else.
    check("content_revisions_two_person", sql`not (${t.requiresSecondPerson} and ${t.state} = 'approved' and ${t.approvedBy} is not distinct from ${t.createdBy})`),
  ],
);
