-- The statistics views (docs/platform/06-analytics-statistics-verification.md section 2). Every number the platform shows about the catalogue, the content, the
-- affiliate programmes and the submissions is defined here once. They count only what the public site shows: published rows that are not soft-deleted.
-- security_invoker makes the views obey Row Level Security as the caller, so they open nothing that the tables do not.
CREATE VIEW public.v_stats_catalog WITH (security_invoker = true) AS
SELECT
  count(*)::int AS tools,
  (SELECT count(*)::int FROM public.categories c WHERE c.parent_id IS NULL AND c.status = 'published' AND c.deleted_at IS NULL AND c.is_visible) AS categories,
  count(*) FILTER (WHERE t.pricing_status = 'verified')::int AS verified,
  count(*) FILTER (WHERE t.pricing_status = 'partial')::int AS partial,
  count(*) FILTER (WHERE t.pricing_status = 'unverified')::int AS unverified,
  count(*) FILTER (WHERE t.pricing_model = 'free')::int AS free,
  count(*) FILTER (WHERE t.pricing_model = 'freemium')::int AS freemium,
  count(*) FILTER (WHERE t.pricing_model = 'paid')::int AS paid,
  count(*) FILTER (WHERE t.pricing_model NOT IN ('free', 'freemium', 'paid'))::int AS other,
  count(*) FILTER (WHERE (t.pricing_free ->> 'available') = 'true')::int AS with_free_plan
FROM public.tools t
WHERE t.status = 'published' AND t.deleted_at IS NULL;
--> statement-breakpoint
CREATE VIEW public.v_stats_content WITH (security_invoker = true) AS
SELECT
  (SELECT count(*)::int FROM public.reviews r WHERE r.status = 'published' AND r.deleted_at IS NULL AND r.method = 'documentation') AS reviews_documentation,
  (SELECT count(*)::int FROM public.reviews r WHERE r.status = 'published' AND r.deleted_at IS NULL AND r.method = 'hands-on') AS reviews_hands_on,
  (SELECT count(*)::int FROM public.blog_posts b WHERE b.status = 'published' AND b.deleted_at IS NULL AND b.kind = 'guide') AS guides,
  (SELECT count(*)::int FROM public.blog_posts b WHERE b.status = 'published' AND b.deleted_at IS NULL AND b.kind = 'comparison') AS comparison_articles,
  (SELECT count(*)::int FROM public.news_items n WHERE n.status = 'published' AND n.deleted_at IS NULL AND n.same_story_as_id IS NULL) AS news_listed,
  (SELECT count(*)::int FROM public.news_items n WHERE n.status = 'published' AND n.deleted_at IS NULL) AS news_total,
  (SELECT count(*)::int FROM public.roundups r WHERE r.status = 'published' AND r.deleted_at IS NULL) AS roundups,
  (SELECT count(*)::int FROM public.models m WHERE m.status = 'published' AND m.deleted_at IS NULL) AS models;
--> statement-breakpoint
CREATE VIEW public.v_stats_affiliate WITH (security_invoker = true) AS
SELECT
  count(*) FILTER (WHERE p.status = 'approved')::int AS approved,
  count(*) FILTER (WHERE p.status = 'pending')::int AS pending,
  count(*) FILTER (WHERE p.status = 'unavailable')::int AS unavailable,
  count(*) FILTER (WHERE p.status = 'ordinary')::int AS ordinary,
  (SELECT count(*)::int FROM public.affiliate_links) AS links
FROM public.affiliate_programs p;
--> statement-breakpoint
CREATE VIEW public.v_stats_submissions WITH (security_invoker = true) AS
SELECT
  count(*)::int AS total,
  count(*) FILTER (WHERE s.status = 'new')::int AS new,
  count(*) FILTER (WHERE s.status = 'in_review')::int AS in_review,
  count(*) FILTER (WHERE s.status = 'approved')::int AS approved,
  count(*) FILTER (WHERE s.status = 'rejected')::int AS rejected,
  count(*) FILTER (WHERE s.status = 'duplicate')::int AS duplicate,
  count(*) FILTER (WHERE s.status = 'spam')::int AS spam
FROM public.tool_submissions s;
--> statement-breakpoint
REVOKE ALL ON public.v_stats_catalog, public.v_stats_content, public.v_stats_affiliate, public.v_stats_submissions FROM PUBLIC, anon, authenticated;
--> statement-breakpoint
GRANT SELECT ON public.v_stats_catalog, public.v_stats_content, public.v_stats_affiliate, public.v_stats_submissions TO app;
