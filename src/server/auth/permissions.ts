// The one place where roles and permissions are defined (docs/platform/03-security-and-access.md section 3). The database tables roles, permissions and
// role_permissions are seeded from this file (seed.ts) and a test compares them, so the code and the database cannot drift apart silently.
//
// A grant has a scope:
//   "all"            the permission applies to every row
//   "own_drafts"     only to rows the member created, while they are draft or in review (CONTRIBUTOR); checked by canActOnRow
//   "non_sensitive"  everything except sensitive fields (EDITOR publishing tools); checked by canChangeFields

export type RoleKey = "owner" | "admin" | "editor" | "reviewer" | "analyst" | "contributor";
export type Scope = "all" | "own_drafts" | "non_sensitive";

export const ROLES: { key: RoleKey; label: string }[] = [
  { key: "owner", label: "Owner" },
  { key: "admin", label: "Admin" },
  { key: "editor", label: "Editor" },
  { key: "reviewer", label: "Reviewer" },
  { key: "analyst", label: "Analyst" },
  { key: "contributor", label: "Contributor" },
];

type Grants = Partial<Record<RoleKey, Scope>>;
const ALL_STAFF: Grants = { owner: "all", admin: "all", editor: "all" };
const staffPlus = (extra: Grants): Grants => ({ ...ALL_STAFF, ...extra });

/** key -> description and who holds it. Matches the table in the design document; rows the design left open are marked (D-05). */
export const PERMISSIONS: Record<string, { description: string; grants: Grants }> = {
  "tools:read": { description: "See tools, including drafts", grants: staffPlus({ reviewer: "all", contributor: "all" }) },
  "tools:create": { description: "Create a tool", grants: staffPlus({ contributor: "own_drafts" }) },
  "tools:update": { description: "Edit a tool", grants: staffPlus({ contributor: "own_drafts" }) },
  "tools:publish": { description: "Publish a tool (editors: non-sensitive fields only)", grants: { owner: "all", admin: "all", editor: "non_sensitive" } },
  "tools:archive": { description: "Archive a tool", grants: { owner: "all", admin: "all", editor: "non_sensitive" } },
  "tools:delete": { description: "Permanently delete a tool that was never published", grants: { owner: "all" } },

  "categories:read": { description: "See categories", grants: staffPlus({ reviewer: "all", contributor: "all" }) },
  "categories:create": { description: "Create a category", grants: ALL_STAFF },
  "categories:update": { description: "Edit a category", grants: ALL_STAFF },
  "categories:assign": { description: "Assign tools to categories", grants: ALL_STAFF },
  "categories:visibility": { description: "Show or hide a category", grants: ALL_STAFF },

  "reviews:read": { description: "See reviews, including drafts", grants: staffPlus({ reviewer: "all", contributor: "all" }) },
  "reviews:create": { description: "Create a review", grants: { owner: "all", admin: "all", reviewer: "all", contributor: "own_drafts" } },
  "reviews:update": { description: "Edit a review", grants: { owner: "all", admin: "all", reviewer: "all", contributor: "own_drafts" } },
  "reviews:publish": { description: "Publish a review (a second approver is needed for sensitive changes)", grants: { owner: "all", admin: "all", reviewer: "all" } },
  "reviews:archive": { description: "Archive a review", grants: ALL_STAFF },
  "verification:write": { description: "Record a human verification of a tool", grants: { owner: "all", admin: "all", reviewer: "all" } },

  "blog:read": { description: "See articles, including drafts", grants: staffPlus({ contributor: "all" }) },
  "blog:create": { description: "Create an article", grants: staffPlus({ contributor: "own_drafts" }) },
  "blog:update": { description: "Edit an article", grants: staffPlus({ contributor: "own_drafts" }) },
  "blog:publish": { description: "Publish an article", grants: ALL_STAFF },
  "blog:archive": { description: "Archive an article", grants: ALL_STAFF },
  "news:read": { description: "See news items, including drafts", grants: staffPlus({ contributor: "all" }) },
  "news:create": { description: "Create a news item", grants: staffPlus({ contributor: "own_drafts" }) },
  "news:update": { description: "Edit a news item", grants: staffPlus({ contributor: "own_drafts" }) },
  "news:publish": { description: "Publish a news item", grants: ALL_STAFF },
  "news:archive": { description: "Archive a news item", grants: ALL_STAFF },

  "affiliate:read": { description: "See affiliate programmes and their status (D-05)", grants: ALL_STAFF },
  "affiliate:write": { description: "Change an affiliate programme or link (D-05)", grants: { owner: "all", admin: "all" } },
  "submissions:read": { description: "See tool submissions", grants: { owner: "all", admin: "all" } },
  "submissions:decide": { description: "Approve, reject or mark a submission", grants: { owner: "all", admin: "all" } },

  "media:upload": { description: "Upload a file (contributors: to their own drafts)", grants: staffPlus({ reviewer: "all", contributor: "own_drafts" }) },
  "media:delete": { description: "Delete a file", grants: { owner: "all", admin: "all" } },
  "analytics:read": { description: "See analytics", grants: staffPlus({ analyst: "all" }) },

  "team:read": { description: "See the team", grants: { owner: "all", admin: "all" } },
  "team:invite": { description: "Invite a team member", grants: { owner: "all" } },
  "team:role": { description: "Change a member's role", grants: { owner: "all" } },
  "team:disable": { description: "Disable or re-enable a member", grants: { owner: "all" } },
  "settings:read": { description: "See settings (D-05)", grants: { owner: "all", admin: "all" } },
  "settings:write": { description: "Change settings (D-05)", grants: { owner: "all" } },
  "audit:read": { description: "Read the audit log (D-05)", grants: { owner: "all" } },
  "system:health": { description: "See system health", grants: { owner: "all", admin: "all" } },
};

export type PermissionKey = keyof typeof PERMISSIONS & string;

/** Fields whose change needs a human verification record and, when two people can publish, a second approver (design section 5). */
export const SENSITIVE_FIELD_PATTERNS = [/^pricing/, /^verification/, /^verified/, /^catalog_verified/, /^method$/, /^testing/, /^affiliate/];
export const isSensitiveField = (name: string) => SENSITIVE_FIELD_PATTERNS.some((p) => p.test(name));

export const grantsFor = (role: RoleKey) => Object.entries(PERMISSIONS).flatMap(([key, p]) => (p.grants[role] ? [{ key, scope: p.grants[role]! }] : []));
export const scopeOf = (role: RoleKey, permission: string): Scope | undefined => PERMISSIONS[permission]?.grants[role];

/** Who may grant or take away which role. Only an owner grants owner; nobody changes their own role. */
export function canAssignRole(actorRole: RoleKey, targetRole: RoleKey): boolean {
  return targetRole === "owner" ? actorRole === "owner" : PERMISSIONS["team:role"].grants[actorRole] !== undefined;
}
