"use server";
// Every change from the admin pages goes through here: the guard runs first, the shared data-layer function does the work, and the answer comes
// back as a message on the page the person came from. Errors from the rules are shown in plain words; anything unexpected is not echoed.
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { setCategoryVisibility, setStatus, updateToolBasics, type Status } from "../../../src/server/admin/mutations.ts";
import type { ContentKind } from "../../../src/server/admin/queries.ts";
import { AuthError } from "../../../src/server/auth/authorize.ts";
import type { RoleKey } from "../../../src/server/auth/permissions.ts";
import { changeRole, disableMember, enableMember, inviteMember } from "../../../src/server/auth/team.ts";
import { getDeps } from "../../lib/deps.ts";
import { clientIp, requirePage } from "../../lib/session.ts";

const KINDS = ["tools", "reviews", "blog", "news"];
const str = (f: FormData, k: string) => String(f.get(k) ?? "");
const back = (f: FormData) => {
  const b = str(f, "back");
  return /^\/[\w\-/]*$/.test(b) ? b : "/";
};

function done(path: string, ok: string): never {
  redirect(`${path}?ok=${encodeURIComponent(ok)}`);
}
function fail(path: string, e: unknown): never {
  let message = "Something went wrong and nothing was saved.";
  if (e instanceof AuthError) message = e.status === 403 ? "You are not allowed to do that." : e.status === 409 ? ruleMessage(e) : "Please sign in again.";
  else if (e instanceof ZodError) message = `Not saved: ${e.issues.map((i) => `${i.path.join(".") || "value"} ${i.message.toLowerCase()}`).join("; ")}.`;
  redirect(`${path}?err=${encodeURIComponent(message)}`);
}
const ruleMessage = (e: AuthError) =>
  ({ last_owner: "The last active owner cannot be demoted or disabled.", already_member: "That address is already on the team.", not_found: "That item no longer exists.", rule_violation: `The database rules refuse this: ${e.message}`, not_disabled: "That member is not disabled." })[e.code] ?? "That change is not allowed.";

export async function changeStatusAction(form: FormData) {
  const path = back(form);
  const kind = str(form, "kind");
  const member = await requirePage(path);
  let msg = "";
  try {
    if (!KINDS.includes(kind)) throw new AuthError(409, "bad_status");
    const to = str(form, "to") as Status;
    const r = await setStatus(getDeps(), member, kind as ContentKind, str(form, "slug"), to, { ip: await clientIp() });
    msg = r.changed ? `Status changed to ${to.replace("_", " ")}.${r.rebuild === "requested" ? " A rebuild of the public site was requested." : r.rebuild === "failed" ? " The rebuild request failed; the change is saved." : ""}` : "Nothing to change.";
  } catch (e) {
    fail(path, e);
  }
  done(path, msg);
}

export async function saveToolAction(form: FormData) {
  const path = back(form);
  const member = await requirePage(path);
  let msg = "";
  try {
    const key = str(form, "key_feature").trim();
    const r = await updateToolBasics(getDeps(), member, str(form, "slug"), { tagline: str(form, "tagline"), description: str(form, "description"), key_feature: key || null }, { ip: await clientIp() });
    msg = r.changed ? "Saved." : "Nothing changed.";
  } catch (e) {
    fail(path, e);
  }
  done(path, msg);
}

export async function categoryVisibilityAction(form: FormData) {
  const path = back(form);
  const member = await requirePage(path);
  let msg = "";
  try {
    const visible = str(form, "visible") === "true";
    const r = await setCategoryVisibility(getDeps(), member, Number(str(form, "id")), visible, { ip: await clientIp() });
    msg = r.changed ? (visible ? "Category is visible." : "Category is hidden.") : "Nothing changed.";
  } catch (e) {
    fail(path, e);
  }
  done(path, msg);
}

export async function inviteAction(form: FormData) {
  const member = await requirePage("/team");
  let msg = "";
  try {
    const r = await inviteMember(getDeps(), member, { email: str(form, "email"), role: str(form, "role") as RoleKey }, { ip: await clientIp() });
    msg = `Invitation sent to ${r.email}.`;
  } catch (e) {
    fail("/team", e);
  }
  done("/team", msg);
}

export async function memberAction(form: FormData) {
  const member = await requirePage("/team");
  const id = Number(str(form, "id"));
  const op = str(form, "op");
  let msg = "";
  try {
    const ctx = { ip: await clientIp() };
    if (op === "role") {
      await changeRole(getDeps(), member, id, str(form, "role") as RoleKey, ctx);
      msg = "Role changed.";
    } else if (op === "disable") {
      const r = await disableMember(getDeps(), member, id, ctx);
      msg = r.providerSynced ? "Member disabled." : "Member disabled here. The sign-in service could not be told; the account cannot use this area anyway.";
    } else if (op === "enable") {
      await enableMember(getDeps(), member, id, ctx);
      msg = "Member enabled.";
    } else throw new AuthError(409, "bad_status");
  } catch (e) {
    fail("/team", e);
  }
  done("/team", msg);
}
