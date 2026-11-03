import Nav from "../../components/Nav.tsx";
import { requirePage } from "../../lib/session.ts";
import { signOutAction } from "../login/actions.ts";

const SECTIONS: { href: string; label: string; permission?: string }[] = [
  { href: "/", label: "Overview" },
  { href: "/tools", label: "Tools", permission: "tools:read" },
  { href: "/categories", label: "Categories", permission: "categories:read" },
  { href: "/reviews", label: "Reviews", permission: "reviews:read" },
  { href: "/blog", label: "Blog", permission: "blog:read" },
  { href: "/news", label: "AI News", permission: "news:read" },
  { href: "/affiliate", label: "Affiliate", permission: "affiliate:read" },
  { href: "/submissions", label: "Submissions", permission: "submissions:read" },
  { href: "/analytics", label: "Analytics", permission: "analytics:read" },
  { href: "/team", label: "Team", permission: "team:read" },
  { href: "/settings", label: "Settings", permission: "settings:read" },
  { href: "/audit", label: "Audit log", permission: "audit:read" },
];

export default async function ConsoleLayout({ children }: { children: React.ReactNode }) {
  const member = await requirePage("/");
  const items = SECTIONS.filter((s) => !s.permission || member.permissions.has(s.permission));
  return (
    <div className="shell">
      <aside className="side">
        <p className="brand">AI Tool Picks</p>
        <Nav items={items} />
        <div className="who">
          <div>{member.email}</div>
          <div className="muted">{member.role}</div>
          <form action={signOutAction}><button className="secondary" type="submit">Sign out</button></form>
        </div>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
