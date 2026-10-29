import type { ReactNode } from "react";
import PageHeader from "./PageHeader";

/** Shared layout for About, Disclosure, Privacy and Terms: a header plus a readable text column. */
export default function LegalPage({
  eyebrow,
  title,
  lead,
  path,
  updated,
  children,
}: {
  eyebrow: string;
  title: string;
  lead?: string;
  path: string;
  updated?: string;
  children: ReactNode;
}) {
  return (
    <>
      <PageHeader eyebrow={eyebrow} title={title} lead={lead} crumbs={[{ name: title, href: path }]}>
        {updated && <p className="mt-5 text-sm text-muted">Last updated {updated}</p>}
      </PageHeader>
      <div className="mx-auto max-w-3xl px-5">
        <div className="prose-article">{children}</div>
      </div>
    </>
  );
}
