// Every enumerated value used by the schema. Values that already exist in the application (pricing models, news kinds, topics...) are kept identical
// to the TypeScript unions so the importer needs no translation; tests/db-schema.test.ts compares them with the application code.
import { pgEnum } from "drizzle-orm/pg-core";

export const contentStatus = pgEnum("content_status", ["draft", "in_review", "published", "archived"]);
/** The product's own lifecycle (field `status` in the tool JSON), not the editorial state. */
export const productStatus = pgEnum("product_status", ["active", "renamed", "discontinued"]);

export const pricingStatus = pgEnum("pricing_status", ["verified", "partial", "unverified"]);
export const pricingModel = pgEnum("pricing_model", ["free", "freemium", "free-trial", "paid", "usage-based", "contact-sales", "open-source", "unknown"]);
export const verificationStatus = pgEnum("verification_status", ["verified", "partial", "login-required", "custom-pricing", "unavailable", "discontinued"]);
export const planAudience = pgEnum("plan_audience", ["individual", "team", "business", "enterprise", "api"]);
export const sourceType = pgEnum("source_type", ["pricing", "docs", "official", "other"]);
export const openSourceStatus = pgEnum("open_source_status", ["open-source", "source-available", "open-weights"]);
export const categoryCover = pgEnum("category_cover", ["chip", "board", "neural", "lens", "rack", "wafer", "fibre", "signal"]);

export const reviewMethod = pgEnum("review_method", ["documentation", "hands-on"]);

export const blogKind = pgEnum("blog_kind", ["guide", "comparison"]);
export const blogTopic = pgEnum("blog_topic", [
  "freelancing",
  "writing",
  "design",
  "business",
  "websites",
  "students",
  "developers",
  "productivity",
  "imagevideo",
  "beginners",
  "research",
  "automation",
  "marketing",
  "comparisons",
  "security",
]);
export const newsKind = pgEnum("news_kind", ["New product", "Feature update", "Model release", "Research", "Policy update", "Company announcement", "Open standard"]);
export const newsTag = pgEnum("news_tag", ["Products", "Models", "Research", "Policy & safety", "Company news", "Open standards"]);

export const affiliateStatus = pgEnum("affiliate_status", ["approved", "pending", "unavailable", "ordinary"]);
export const applicationStatus = pgEnum("application_status", ["draft", "submitted", "approved", "rejected", "withdrawn"]);

export const submissionStatus = pgEnum("submission_status", ["new", "in_review", "approved", "rejected", "duplicate", "spam"]);
export const submissionSource = pgEnum("submission_source", ["web", "github"]);
export const submissionDecisionKind = pgEnum("submission_decision_kind", ["approved", "rejected", "duplicate", "spam", "needs_info", "note"]);

export const memberStatus = pgEnum("member_status", ["invited", "active", "disabled"]);
export const revisionState = pgEnum("revision_state", ["draft", "submitted", "approved", "rejected"]);

export const analyticsEventName = pgEnum("analytics_event_name", [
  "page_view",
  "tool_view",
  "directory_search",
  "category_visit",
  "outbound_official",
  "outbound_affiliate",
  "submission_created",
]);
export const deviceClass = pgEnum("device_class", ["mobile", "tablet", "desktop"]);

export const mediaStorage = pgEnum("media_storage", ["repo", "supabase"]);
export const mediaKind = pgEnum("media_kind", ["logo", "tool_image", "news_image", "article_image", "screenshot", "cover", "brand"]);
