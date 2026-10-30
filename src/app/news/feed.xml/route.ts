import { NEWS } from "@/data/news";
import { SITE, absUrl } from "@/lib/site";

export const dynamic = "force-static";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A real subscription mechanism: an RSS feed of the stories already published on /news/ (summary, our note and a link to the source). */
export function GET() {
  const items = [...NEWS].sort((a, b) => b.date.localeCompare(a.date));
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.name)}: AI news</title>
    <link>${absUrl("/news/")}</link>
    <description>Hand-checked AI news with original sources, from ${esc(SITE.name)}.</description>
    <language>en</language>
    <lastBuildDate>${new Date(`${items[0].date}T12:00:00Z`).toUTCString()}</lastBuildDate>
    <atom:link href="${absUrl("/news/feed.xml")}" rel="self" type="application/rss+xml"/>
${items
  .map(
    (n) => `    <item>
      <title>${esc(n.title)}</title>
      <link>${absUrl(`/news/${n.slug}/`)}</link>
      <guid isPermaLink="true">${absUrl(`/news/${n.slug}/`)}</guid>
      <pubDate>${new Date(`${n.date}T12:00:00Z`).toUTCString()}</pubDate>
      <category>${esc(n.kind)}</category>
      <description>${esc(`${n.summary} Why it may matter: ${n.matters} Source: ${n.source} (${n.url})`)}</description>
    </item>`,
  )
  .join("\n")}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
