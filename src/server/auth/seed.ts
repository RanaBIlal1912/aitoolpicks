// Makes the roles, permissions and role_permissions tables equal to permissions.ts. Safe to run any number of times; it reports what it changed
// and writes one audit row when something did change. Run at deploy time (npm run auth:seed), never from a request.
import type { Sql } from "../db/client.ts";
import { writeAudit } from "./audit.ts";
import { PERMISSIONS, ROLES } from "./permissions.ts";

export type SeedResult = { rolesAdded: string[]; permissionsAdded: string[]; permissionsRemoved: string[]; grantsAdded: string[]; grantsRemoved: string[]; changed: boolean };

export async function seedAccess(sql: Sql): Promise<SeedResult> {
  const result: SeedResult = { rolesAdded: [], permissionsAdded: [], permissionsRemoved: [], grantsAdded: [], grantsRemoved: [], changed: false };
  await sql.begin(async (raw) => {
    const tx = raw as unknown as Sql;
    for (const r of ROLES) {
      const [row] = await tx<{ id: number }[]>`insert into roles (key, label, is_system) values (${r.key}, ${r.label}, true) on conflict (key) do update set label = excluded.label, is_system = true returning (xmax = 0) as inserted, id`;
      if ((row as unknown as { inserted: boolean }).inserted) result.rolesAdded.push(r.key);
    }
    const have = new Set((await tx<{ key: string }[]>`select key from permissions`).map((p) => p.key));
    for (const [key, p] of Object.entries(PERMISSIONS)) {
      await tx`insert into permissions (key, description) values (${key}, ${p.description}) on conflict (key) do update set description = excluded.description`;
      if (!have.has(key)) result.permissionsAdded.push(key);
    }
    const wanted = new Set(Object.keys(PERMISSIONS));
    for (const key of have) {
      if (!wanted.has(key)) {
        await tx`delete from permissions where key = ${key}`;
        result.permissionsRemoved.push(key);
      }
    }
    const current = new Set((await tx<{ r: string; p: string }[]>`select r.key as r, p.key as p from role_permissions rp join roles r on r.id = rp.role_id join permissions p on p.id = rp.permission_id`).map((g) => `${g.r}|${g.p}`));
    const want = new Set<string>();
    for (const [key, p] of Object.entries(PERMISSIONS)) for (const role of Object.keys(p.grants)) want.add(`${role}|${key}`);
    for (const g of want) {
      if (current.has(g)) continue;
      const [role, perm] = g.split("|");
      await tx`insert into role_permissions (role_id, permission_id) select r.id, p.id from roles r, permissions p where r.key = ${role} and p.key = ${perm}`;
      result.grantsAdded.push(g);
    }
    for (const g of current) {
      if (want.has(g)) continue;
      const [role, perm] = g.split("|");
      await tx`delete from role_permissions where role_id = (select id from roles where key = ${role}) and permission_id = (select id from permissions where key = ${perm})`;
      result.grantsRemoved.push(g);
    }
    result.changed = Object.values(result).some((v) => Array.isArray(v) && v.length > 0);
    if (result.changed) {
      await writeAudit(tx, { actor: null, action: "access.seeded", entityType: "roles", after: { rolesAdded: result.rolesAdded, permissionsAdded: result.permissionsAdded, permissionsRemoved: result.permissionsRemoved, grantsAdded: result.grantsAdded.length, grantsRemoved: result.grantsRemoved } });
    }
  });
  return result;
}
