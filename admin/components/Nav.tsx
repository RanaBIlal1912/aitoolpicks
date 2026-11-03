"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Nav({ items }: { items: { href: string; label: string }[] }) {
  const path = usePathname();
  return (
    <nav aria-label="Sections">
      {items.map((i) => {
        const current = i.href === "/" ? path === "/" : path === i.href || path.startsWith(`${i.href}/`);
        return <Link key={i.href} href={i.href} aria-current={current ? "page" : undefined}>{i.label}</Link>;
      })}
    </nav>
  );
}
