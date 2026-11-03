CREATE TYPE "public"."affiliate_status" AS ENUM('approved', 'pending', 'unavailable', 'ordinary');--> statement-breakpoint
CREATE TYPE "public"."analytics_event_name" AS ENUM('page_view', 'tool_view', 'directory_search', 'category_visit', 'outbound_official', 'outbound_affiliate', 'submission_created');--> statement-breakpoint
CREATE TYPE "public"."application_status" AS ENUM('draft', 'submitted', 'approved', 'rejected', 'withdrawn');--> statement-breakpoint
CREATE TYPE "public"."blog_kind" AS ENUM('guide', 'comparison');--> statement-breakpoint
CREATE TYPE "public"."blog_topic" AS ENUM('freelancing', 'writing', 'design', 'business', 'websites', 'students', 'developers', 'productivity', 'imagevideo', 'beginners', 'research', 'automation', 'marketing', 'comparisons', 'security');--> statement-breakpoint
CREATE TYPE "public"."category_cover" AS ENUM('chip', 'board', 'neural', 'lens', 'rack', 'wafer', 'fibre', 'signal');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('draft', 'in_review', 'published', 'archived');--> statement-breakpoint
CREATE TYPE "public"."device_class" AS ENUM('mobile', 'tablet', 'desktop');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('logo', 'tool_image', 'news_image', 'article_image', 'screenshot', 'cover', 'brand');--> statement-breakpoint
CREATE TYPE "public"."media_storage" AS ENUM('repo', 'supabase');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('invited', 'active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."news_kind" AS ENUM('New product', 'Feature update', 'Model release', 'Research', 'Policy update', 'Company announcement', 'Open standard');--> statement-breakpoint
CREATE TYPE "public"."news_tag" AS ENUM('Products', 'Models', 'Research', 'Policy & safety', 'Company news', 'Open standards');--> statement-breakpoint
CREATE TYPE "public"."open_source_status" AS ENUM('open-source', 'source-available', 'open-weights');--> statement-breakpoint
CREATE TYPE "public"."plan_audience" AS ENUM('individual', 'team', 'business', 'enterprise', 'api');--> statement-breakpoint
CREATE TYPE "public"."pricing_model" AS ENUM('free', 'freemium', 'free-trial', 'paid', 'usage-based', 'contact-sales', 'open-source', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."pricing_status" AS ENUM('verified', 'partial', 'unverified');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('active', 'renamed', 'discontinued');--> statement-breakpoint
CREATE TYPE "public"."review_method" AS ENUM('documentation', 'hands-on');--> statement-breakpoint
CREATE TYPE "public"."revision_state" AS ENUM('draft', 'submitted', 'approved', 'rejected');--> statement-breakpoint
CREATE TYPE "public"."source_type" AS ENUM('pricing', 'docs', 'official', 'other');--> statement-breakpoint
CREATE TYPE "public"."submission_decision_kind" AS ENUM('approved', 'rejected', 'duplicate', 'spam', 'needs_info', 'note');--> statement-breakpoint
CREATE TYPE "public"."submission_source" AS ENUM('web', 'github');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('new', 'in_review', 'approved', 'rejected', 'duplicate', 'spam');--> statement-breakpoint
CREATE TYPE "public"."verification_status" AS ENUM('verified', 'partial', 'login-required', 'custom-pricing', 'unavailable', 'discontinued');--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "audit_logs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_member_id" bigint,
	"action" text NOT NULL,
	"entity_type" text DEFAULT '' NOT NULL,
	"entity_id" text DEFAULT '' NOT NULL,
	"before" jsonb,
	"after" jsonb,
	"request_id" text,
	"ip_hash" text,
	CONSTRAINT "audit_logs_action_format" CHECK ("audit_logs"."action" ~ '^[a-z_]+(\.[a-z_]+)+$')
);
--> statement-breakpoint
CREATE TABLE "content_revisions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "content_revisions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"entity_type" text NOT NULL,
	"entity_id" bigint NOT NULL,
	"revision" integer NOT NULL,
	"data" jsonb NOT NULL,
	"state" "revision_state" DEFAULT 'draft' NOT NULL,
	"requires_second_person" boolean DEFAULT false NOT NULL,
	"created_by" bigint,
	"approved_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"decided_at" timestamp with time zone,
	CONSTRAINT "content_revisions_entity_revision_key" UNIQUE("entity_type","entity_id","revision"),
	CONSTRAINT "content_revisions_revision_positive" CHECK ("content_revisions"."revision" >= 1),
	CONSTRAINT "content_revisions_approver_present" CHECK ("content_revisions"."state" <> 'approved' or "content_revisions"."approved_by" is not null),
	CONSTRAINT "content_revisions_two_person" CHECK (not ("content_revisions"."requires_second_person" and "content_revisions"."state" = 'approved' and "content_revisions"."approved_by" is not distinct from "content_revisions"."created_by"))
);
--> statement-breakpoint
CREATE TABLE "permissions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "permissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"key" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	CONSTRAINT "permissions_key_key" UNIQUE("key"),
	CONSTRAINT "permissions_key_format" CHECK ("permissions"."key" ~ '^[a-z_]+:[a-z_*]+$')
);
--> statement-breakpoint
CREATE TABLE "role_permissions" (
	"role_id" bigint NOT NULL,
	"permission_id" bigint NOT NULL,
	CONSTRAINT "role_permissions_role_id_permission_id_pk" PRIMARY KEY("role_id","permission_id")
);
--> statement-breakpoint
CREATE TABLE "roles" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "roles_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"key" text NOT NULL,
	"label" text NOT NULL,
	"is_system" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roles_key_key" UNIQUE("key"),
	CONSTRAINT "roles_key_format" CHECK ("roles"."key" ~ '^[a-z][a-z_]*$')
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "team_members_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"auth_user_id" uuid,
	"email" text NOT NULL,
	"display_name" text DEFAULT '' NOT NULL,
	"role_id" bigint NOT NULL,
	"status" "member_status" DEFAULT 'invited' NOT NULL,
	"invited_by" bigint,
	"invited_at" timestamp with time zone,
	"last_seen_at" timestamp with time zone,
	"disabled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_email_format" CHECK ("team_members"."email" ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
	CONSTRAINT "team_members_disabled_consistent" CHECK (("team_members"."status" = 'disabled') = ("team_members"."disabled_at" is not null))
);
--> statement-breakpoint
CREATE TABLE "categories" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "categories_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"parent_id" bigint,
	"label" text NOT NULL,
	"short_label" text DEFAULT '' NOT NULL,
	"blurb" text DEFAULT '' NOT NULL,
	"cover" "category_cover",
	"sort_order" integer DEFAULT 0 NOT NULL,
	"is_visible" boolean DEFAULT true NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"deleted_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_by" bigint,
	"updated_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "categories_slug_format" CHECK ("categories"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "categories_published_has_date" CHECK ("categories"."status" <> 'published' or "categories"."published_at" is not null),
	CONSTRAINT "categories_top_has_cover" CHECK ("categories"."parent_id" is not null or "categories"."cover" is not null)
);
--> statement-breakpoint
CREATE TABLE "companies" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "companies_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"website" text,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"deleted_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_by" bigint,
	"updated_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "companies_slug_key" UNIQUE("slug"),
	CONSTRAINT "companies_slug_format" CHECK ("companies"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "companies_published_has_date" CHECK ("companies"."status" <> 'published' or "companies"."published_at" is not null),
	CONSTRAINT "companies_website_https" CHECK ("companies"."website" is null or "companies"."website" ~ '^https://[^/ ]+\.[^/ ]+')
);
--> statement-breakpoint
CREATE TABLE "pricing_plans" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "pricing_plans_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tool_id" bigint NOT NULL,
	"position" integer NOT NULL,
	"name" text NOT NULL,
	"audience" "plan_audience" NOT NULL,
	"currency" text NOT NULL,
	"unit" text NOT NULL,
	"monthly" numeric(12, 2),
	"annual" numeric(12, 2),
	"annual_total" numeric(12, 2),
	"billing" text,
	"is_custom" boolean DEFAULT false NOT NULL,
	"highlights" text[] DEFAULT '{}'::text[] NOT NULL,
	"limits" text[] DEFAULT '{}'::text[] NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "pricing_plans_tool_position_key" UNIQUE("tool_id","position"),
	CONSTRAINT "pricing_plans_currency_format" CHECK ("pricing_plans"."currency" ~ '^[A-Z]{3}$'),
	CONSTRAINT "pricing_plans_amounts_non_negative" CHECK (coalesce("pricing_plans"."monthly", 0) >= 0 and coalesce("pricing_plans"."annual", 0) >= 0 and coalesce("pricing_plans"."annual_total", 0) >= 0),
	CONSTRAINT "pricing_plans_position_positive" CHECK ("pricing_plans"."position" >= 1)
);
--> statement-breakpoint
CREATE TABLE "tool_alternatives" (
	"tool_id" bigint NOT NULL,
	"alternative_tool_id" bigint NOT NULL,
	"sort_order" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "tool_alternatives_tool_id_alternative_tool_id_pk" PRIMARY KEY("tool_id","alternative_tool_id"),
	CONSTRAINT "tool_alternatives_not_self" CHECK ("tool_alternatives"."tool_id" <> "tool_alternatives"."alternative_tool_id")
);
--> statement-breakpoint
CREATE TABLE "tool_categories" (
	"tool_id" bigint NOT NULL,
	"category_id" bigint NOT NULL,
	CONSTRAINT "tool_categories_tool_id_category_id_pk" PRIMARY KEY("tool_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "tool_sources" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tool_sources_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tool_id" bigint NOT NULL,
	"label" text NOT NULL,
	"url" text NOT NULL,
	"type" "source_type" DEFAULT 'other' NOT NULL,
	"checked_at" date,
	CONSTRAINT "tool_sources_tool_url_key" UNIQUE("tool_id","url"),
	CONSTRAINT "tool_sources_url_https" CHECK ("tool_sources"."url" ~ '^https://[^/ ]+\.[^/ ]+')
);
--> statement-breakpoint
CREATE TABLE "tools" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tools_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"company_id" bigint NOT NULL,
	"primary_category_id" bigint NOT NULL,
	"subcategory_id" bigint,
	"product_status" "product_status" DEFAULT 'active' NOT NULL,
	"tagline" text NOT NULL,
	"description" text NOT NULL,
	"website_url" text NOT NULL,
	"hue" smallint DEFAULT 210 NOT NULL,
	"platforms" text[] DEFAULT '{}'::text[] NOT NULL,
	"aliases" text[] DEFAULT '{}'::text[] NOT NULL,
	"key_feature" text,
	"logo_site" text,
	"is_featured" boolean DEFAULT false NOT NULL,
	"open_source_status" "open_source_status",
	"open_source_note" text,
	"open_source_source" text,
	"added_on" date DEFAULT now() NOT NULL,
	"features" text[] DEFAULT '{}'::text[] NOT NULL,
	"use_cases" text[] DEFAULT '{}'::text[] NOT NULL,
	"audience" text[] DEFAULT '{}'::text[] NOT NULL,
	"strengths" text[] DEFAULT '{}'::text[] NOT NULL,
	"limitations" text[] DEFAULT '{}'::text[] NOT NULL,
	"profile" jsonb,
	"pricing_status" "pricing_status" DEFAULT 'unverified' NOT NULL,
	"pricing_model" "pricing_model" DEFAULT 'unknown' NOT NULL,
	"pricing_checked_at" date,
	"pricing_source_url" text,
	"pricing_regional_note" text,
	"pricing_free" jsonb,
	"pricing_api" jsonb,
	"pricing_trial" text,
	"pricing_reference" jsonb,
	"pricing_notes" text[] DEFAULT '{}'::text[] NOT NULL,
	"verification_status" "verification_status" DEFAULT 'partial' NOT NULL,
	"verified_at" date,
	"official_url" text,
	"pricing_url" text,
	"verification_method" text,
	"verification_notes" text,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"deleted_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_by" bigint,
	"updated_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tools_slug_key" UNIQUE("slug"),
	CONSTRAINT "tools_slug_format" CHECK ("tools"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "tools_published_has_date" CHECK ("tools"."status" <> 'published' or "tools"."published_at" is not null),
	CONSTRAINT "tools_website_https" CHECK ("tools"."website_url" ~ '^https://[^/ ]+\.[^/ ]+'),
	CONSTRAINT "tools_official_https" CHECK ("tools"."official_url" is null or "tools"."official_url" ~ '^https://[^/ ]+\.[^/ ]+'),
	CONSTRAINT "tools_pricing_url_https" CHECK ("tools"."pricing_url" is null or "tools"."pricing_url" ~ '^https://[^/ ]+\.[^/ ]+'),
	CONSTRAINT "tools_pricing_source_https" CHECK ("tools"."pricing_source_url" is null or "tools"."pricing_source_url" ~ '^https://[^/ ]+\.[^/ ]+'),
	CONSTRAINT "tools_open_source_source_https" CHECK ("tools"."open_source_source" is null or "tools"."open_source_source" ~ '^https://[^/ ]+\.[^/ ]+'),
	CONSTRAINT "tools_hue_range" CHECK ("tools"."hue" between 0 and 360),
	CONSTRAINT "tools_name_not_blank" CHECK (length(btrim("tools"."name")) > 0),
	CONSTRAINT "tools_verified_has_date" CHECK ("tools"."pricing_status" <> 'verified' or "tools"."pricing_checked_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "verification_checks" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "verification_checks_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tool_id" bigint NOT NULL,
	"checked_at" timestamp with time zone DEFAULT now() NOT NULL,
	"status" "verification_status" NOT NULL,
	"method" text DEFAULT '' NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"automated" boolean DEFAULT false NOT NULL,
	"checked_by" bigint,
	CONSTRAINT "verification_checks_actor" CHECK (("verification_checks"."automated" and "verification_checks"."checked_by" is null) or (not "verification_checks"."automated"))
);
--> statement-breakpoint
CREATE TABLE "analytics_daily" (
	"day" date NOT NULL,
	"event" "analytics_event_name" NOT NULL,
	"tool_id" bigint DEFAULT 0 NOT NULL,
	"category_id" bigint DEFAULT 0 NOT NULL,
	"path_group" text DEFAULT '' NOT NULL,
	"count" integer NOT NULL,
	CONSTRAINT "analytics_daily_day_event_tool_id_category_id_path_group_pk" PRIMARY KEY("day","event","tool_id","category_id","path_group"),
	CONSTRAINT "analytics_daily_count" CHECK ("analytics_daily"."count" >= 0)
);
--> statement-breakpoint
CREATE TABLE "analytics_events" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "analytics_events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"event" "analytics_event_name" NOT NULL,
	"path_group" text DEFAULT '' NOT NULL,
	"tool_id" bigint,
	"category_id" bigint,
	"query_length" smallint,
	"result_count" integer,
	"placement" text,
	"device_class" "device_class",
	"country" char(2),
	"visitor_hash" text,
	CONSTRAINT "analytics_events_country_format" CHECK ("analytics_events"."country" is null or "analytics_events"."country" ~ '^[A-Z]{2}$'),
	CONSTRAINT "analytics_events_query_length" CHECK ("analytics_events"."query_length" is null or "analytics_events"."query_length" between 0 and 500)
);
--> statement-breakpoint
CREATE TABLE "media_assets" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "media_assets_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"storage" "media_storage" DEFAULT 'repo' NOT NULL,
	"path" text NOT NULL,
	"kind" "media_kind" NOT NULL,
	"mime" text NOT NULL,
	"bytes" integer,
	"width" integer,
	"height" integer,
	"sha256" char(64),
	"alt_text" text DEFAULT '' NOT NULL,
	"credit" text,
	"source_url" text,
	"tool_id" bigint,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"deleted_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_by" bigint,
	"updated_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_assets_storage_path_key" UNIQUE("storage","path"),
	CONSTRAINT "media_assets_path_relative" CHECK ("media_assets"."path" !~ '^[a-z]+://' and "media_assets"."path" !~ '\.\.'),
	CONSTRAINT "media_assets_mime_format" CHECK ("media_assets"."mime" ~ '^[a-z]+/[a-z0-9.+-]+$'),
	CONSTRAINT "media_assets_sha_format" CHECK ("media_assets"."sha256" is null or "media_assets"."sha256" ~ '^[0-9a-f]{64}$'),
	CONSTRAINT "media_assets_size_positive" CHECK (coalesce("media_assets"."bytes", 1) > 0 and coalesce("media_assets"."width", 1) > 0 and coalesce("media_assets"."height", 1) > 0)
);
--> statement-breakpoint
CREATE TABLE "rate_limit_hits" (
	"key_hash" text NOT NULL,
	"route" text NOT NULL,
	"window_start" timestamp with time zone NOT NULL,
	"count" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "rate_limit_hits_key_hash_route_window_start_pk" PRIMARY KEY("key_hash","route","window_start"),
	CONSTRAINT "rate_limit_hits_count" CHECK ("rate_limit_hits"."count" >= 1)
);
--> statement-breakpoint
CREATE TABLE "redirects" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "redirects_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"from_path" text NOT NULL,
	"to_path" text NOT NULL,
	"status_code" smallint DEFAULT 308 NOT NULL,
	"reason" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "redirects_from_key" UNIQUE("from_path"),
	CONSTRAINT "redirects_status" CHECK ("redirects"."status_code" in (301, 302, 307, 308)),
	CONSTRAINT "redirects_paths" CHECK ("redirects"."from_path" ~ '^/' and "redirects"."to_path" ~ '^/' and "redirects"."from_path" <> "redirects"."to_path")
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" bigint,
	CONSTRAINT "site_settings_key_format" CHECK ("site_settings"."key" ~ '^[a-z][a-z0-9_.]*$')
);
--> statement-breakpoint
CREATE TABLE "review_evidence" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "review_evidence_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"review_id" bigint NOT NULL,
	"label" text NOT NULL,
	"url" text,
	"media_asset_id" bigint,
	"caption" text,
	"alt_text" text,
	"position" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "review_evidence_label_present" CHECK (length(btrim("review_evidence"."label")) > 0),
	CONSTRAINT "review_evidence_url_https" CHECK ("review_evidence"."url" is null or "review_evidence"."url" ~ '^https://[^/ ]+\.[^/ ]+'),
	CONSTRAINT "review_evidence_has_target" CHECK ("review_evidence"."url" is not null or "review_evidence"."media_asset_id" is not null),
	CONSTRAINT "review_evidence_screenshot_alt" CHECK ("review_evidence"."media_asset_id" is null or length(btrim(coalesce("review_evidence"."alt_text", ''))) > 0)
);
--> statement-breakpoint
CREATE TABLE "review_testing" (
	"review_id" bigint PRIMARY KEY NOT NULL,
	"tested_by" text NOT NULL,
	"role" text NOT NULL,
	"plan" text NOT NULL,
	"region" text NOT NULL,
	"tested_from" date NOT NULL,
	"tested_to" date NOT NULL,
	"hours" numeric(6, 1),
	"tasks" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"worked" text[] DEFAULT '{}'::text[] NOT NULL,
	"failed" text[] DEFAULT '{}'::text[] NOT NULL,
	"not_reproduced" text[] DEFAULT '{}'::text[] NOT NULL,
	"conflicts" text NOT NULL,
	CONSTRAINT "review_testing_dates_ordered" CHECK ("review_testing"."tested_to" >= "review_testing"."tested_from"),
	CONSTRAINT "review_testing_text_present" CHECK (length(btrim("review_testing"."tested_by")) > 0 and length(btrim("review_testing"."role")) > 0 and length(btrim("review_testing"."plan")) > 0 and length(btrim("review_testing"."region")) > 0 and length(btrim("review_testing"."conflicts")) > 0),
	CONSTRAINT "review_testing_hours_positive" CHECK ("review_testing"."hours" is null or "review_testing"."hours" > 0),
	CONSTRAINT "review_testing_tasks_array" CHECK (jsonb_typeof("review_testing"."tasks") = 'array' and jsonb_array_length("review_testing"."tasks") >= 1),
	CONSTRAINT "review_testing_has_worked_and_failed" CHECK (cardinality("review_testing"."worked") >= 1 and cardinality("review_testing"."failed") >= 1)
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "reviews_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"tool_id" bigint NOT NULL,
	"title" text NOT NULL,
	"summary" text NOT NULL,
	"best_for" text DEFAULT '' NOT NULL,
	"skip_if" text DEFAULT '' NOT NULL,
	"pricing_note" text DEFAULT '' NOT NULL,
	"verdict" text DEFAULT '' NOT NULL,
	"use_cases" text[] DEFAULT '{}'::text[] NOT NULL,
	"pros" text[] DEFAULT '{}'::text[] NOT NULL,
	"cons" text[] DEFAULT '{}'::text[] NOT NULL,
	"method" "review_method" NOT NULL,
	"reviewer_member_id" bigint,
	"reviewer_name" text DEFAULT 'AI Tool Picks editors' NOT NULL,
	"facts_checked_at" date,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"deleted_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_by" bigint,
	"updated_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reviews_slug_key" UNIQUE("slug"),
	CONSTRAINT "reviews_slug_format" CHECK ("reviews"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "reviews_published_has_date" CHECK ("reviews"."status" <> 'published' or "reviews"."published_at" is not null),
	CONSTRAINT "reviews_reviewer_named" CHECK (length(btrim("reviews"."reviewer_name")) > 0)
);
--> statement-breakpoint
CREATE TABLE "authors" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "authors_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"bio" text DEFAULT '' NOT NULL,
	"team_member_id" bigint,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"deleted_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_by" bigint,
	"updated_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "authors_slug_key" UNIQUE("slug"),
	CONSTRAINT "authors_slug_format" CHECK ("authors"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "authors_published_has_date" CHECK ("authors"."status" <> 'published' or "authors"."published_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "blog_post_tools" (
	"post_id" bigint NOT NULL,
	"tool_id" bigint NOT NULL,
	CONSTRAINT "blog_post_tools_post_id_tool_id_pk" PRIMARY KEY("post_id","tool_id")
);
--> statement-breakpoint
CREATE TABLE "blog_posts" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "blog_posts_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"kind" "blog_kind" DEFAULT 'guide' NOT NULL,
	"topic" "blog_topic" NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"blurb" text DEFAULT '' NOT NULL,
	"icon" text DEFAULT '' NOT NULL,
	"category_label" text DEFAULT '' NOT NULL,
	"body_html" text NOT NULL,
	"author_id" bigint,
	"featured_media_id" bigint,
	"seo_title" text,
	"seo_description" text,
	"canonical_override" text,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"deleted_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_by" bigint,
	"updated_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blog_posts_slug_key" UNIQUE("slug"),
	CONSTRAINT "blog_posts_slug_format" CHECK ("blog_posts"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "blog_posts_published_has_date" CHECK ("blog_posts"."status" <> 'published' or "blog_posts"."published_at" is not null),
	CONSTRAINT "blog_posts_canonical_https" CHECK ("blog_posts"."canonical_override" is null or "blog_posts"."canonical_override" ~ '^https://[^/ ]+\.[^/ ]+'),
	CONSTRAINT "blog_posts_body_present" CHECK (length(btrim("blog_posts"."body_html")) > 0)
);
--> statement-breakpoint
CREATE TABLE "comparisons" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "comparisons_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"blog_post_id" bigint NOT NULL,
	"left_label" text NOT NULL,
	"right_label" text NOT NULL,
	"left_tool_id" bigint,
	"right_tool_id" bigint,
	"rows" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"deleted_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_by" bigint,
	"updated_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "comparisons_slug_key" UNIQUE("slug"),
	CONSTRAINT "comparisons_slug_format" CHECK ("comparisons"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "comparisons_published_has_date" CHECK ("comparisons"."status" <> 'published' or "comparisons"."published_at" is not null),
	CONSTRAINT "comparisons_rows_array" CHECK (jsonb_typeof("comparisons"."rows") = 'array')
);
--> statement-breakpoint
CREATE TABLE "model_tools" (
	"model_id" bigint NOT NULL,
	"tool_id" bigint NOT NULL,
	CONSTRAINT "model_tools_model_id_tool_id_pk" PRIMARY KEY("model_id","tool_id")
);
--> statement-breakpoint
CREATE TABLE "models" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "models_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"name" text NOT NULL,
	"company_id" bigint NOT NULL,
	"released" date,
	"summary" text NOT NULL,
	"licence" text NOT NULL,
	"tool_note" text DEFAULT '' NOT NULL,
	"details" text[] DEFAULT '{}'::text[] NOT NULL,
	"sources" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"deleted_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_by" bigint,
	"updated_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "models_slug_key" UNIQUE("slug"),
	CONSTRAINT "models_slug_format" CHECK ("models"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "models_published_has_date" CHECK ("models"."status" <> 'published' or "models"."published_at" is not null),
	CONSTRAINT "models_sources_array" CHECK (jsonb_typeof("models"."sources") = 'array')
);
--> statement-breakpoint
CREATE TABLE "news_items" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "news_items_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"kind" "news_kind" NOT NULL,
	"tag" "news_tag" NOT NULL,
	"importance" smallint DEFAULT 1 NOT NULL,
	"title" text NOT NULL,
	"published_on" date NOT NULL,
	"date_from_url" boolean DEFAULT false NOT NULL,
	"source_id" bigint NOT NULL,
	"source_url" text NOT NULL,
	"summary" text NOT NULL,
	"matters" text DEFAULT '' NOT NULL,
	"same_story_as_id" bigint,
	"source_verified_at" date,
	"source_verified_by" bigint,
	"image" jsonb,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"deleted_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_by" bigint,
	"updated_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_items_slug_key" UNIQUE("slug"),
	CONSTRAINT "news_items_source_url_key" UNIQUE("source_url"),
	CONSTRAINT "news_items_slug_format" CHECK ("news_items"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "news_items_published_has_date" CHECK ("news_items"."status" <> 'published' or "news_items"."published_at" is not null),
	CONSTRAINT "news_items_importance_range" CHECK ("news_items"."importance" between 1 and 3),
	CONSTRAINT "news_items_source_https" CHECK ("news_items"."source_url" ~ '^https://[^/ ]+\.[^/ ]+'),
	CONSTRAINT "news_items_not_own_duplicate" CHECK ("news_items"."same_story_as_id" is null or "news_items"."same_story_as_id" <> "news_items"."id")
);
--> statement-breakpoint
CREATE TABLE "news_sources" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "news_sources_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"website" text,
	"is_official" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "news_sources_website_https" CHECK ("news_sources"."website" is null or "news_sources"."website" ~ '^https://[^/ ]+\.[^/ ]+')
);
--> statement-breakpoint
CREATE TABLE "news_tools" (
	"news_item_id" bigint NOT NULL,
	"tool_id" bigint NOT NULL,
	CONSTRAINT "news_tools_news_item_id_tool_id_pk" PRIMARY KEY("news_item_id","tool_id")
);
--> statement-breakpoint
CREATE TABLE "roundup_picks" (
	"roundup_id" bigint NOT NULL,
	"tool_id" bigint NOT NULL,
	"position" integer NOT NULL,
	"badge" text NOT NULL,
	"why" text NOT NULL,
	CONSTRAINT "roundup_picks_roundup_id_tool_id_pk" PRIMARY KEY("roundup_id","tool_id"),
	CONSTRAINT "roundup_picks_position_key" UNIQUE("roundup_id","position"),
	CONSTRAINT "roundup_picks_position_positive" CHECK ("roundup_picks"."position" >= 1)
);
--> statement-breakpoint
CREATE TABLE "roundups" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "roundups_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category_id" bigint,
	"intro" text[] DEFAULT '{}'::text[] NOT NULL,
	"criteria" text[] DEFAULT '{}'::text[] NOT NULL,
	"note" text,
	"status" "content_status" DEFAULT 'draft' NOT NULL,
	"deleted_at" timestamp with time zone,
	"published_at" timestamp with time zone,
	"created_by" bigint,
	"updated_by" bigint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "roundups_slug_key" UNIQUE("slug"),
	CONSTRAINT "roundups_slug_format" CHECK ("roundups"."slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
	CONSTRAINT "roundups_published_has_date" CHECK ("roundups"."status" <> 'published' or "roundups"."published_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "affiliate_applications" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "affiliate_applications_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"program_id" bigint NOT NULL,
	"status" "application_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp with time zone,
	"decided_at" timestamp with time zone,
	"applied_by" bigint,
	"notes" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "affiliate_applications_submitted_dated" CHECK ("affiliate_applications"."status" not in ('submitted', 'approved', 'rejected') or "affiliate_applications"."submitted_at" is not null),
	CONSTRAINT "affiliate_applications_decided_dated" CHECK ("affiliate_applications"."status" not in ('approved', 'rejected') or "affiliate_applications"."decided_at" is not null)
);
--> statement-breakpoint
CREATE TABLE "affiliate_links" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "affiliate_links_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"program_id" bigint NOT NULL,
	"country_code" text DEFAULT 'default' NOT NULL,
	"url" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "affiliate_links_program_country_key" UNIQUE("program_id","country_code"),
	CONSTRAINT "affiliate_links_country_format" CHECK ("affiliate_links"."country_code" = 'default' or "affiliate_links"."country_code" ~ '^[A-Z]{2}$'),
	CONSTRAINT "affiliate_links_url_https" CHECK ("affiliate_links"."url" ~ '^https://[^/ ]+\.[^/ ]+')
);
--> statement-breakpoint
CREATE TABLE "affiliate_programs" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "affiliate_programs_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"tool_id" bigint NOT NULL,
	"status" "affiliate_status" DEFAULT 'ordinary' NOT NULL,
	"network" text,
	"apply_url" text,
	"terms_url" text,
	"source_url" text,
	"checked_at" date,
	"note" text,
	"disclosure_text" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" bigint,
	CONSTRAINT "affiliate_programs_tool_key" UNIQUE("tool_id"),
	CONSTRAINT "affiliate_programs_apply_https" CHECK ("affiliate_programs"."apply_url" is null or "affiliate_programs"."apply_url" ~ '^https://[^/ ]+\.[^/ ]+'),
	CONSTRAINT "affiliate_programs_terms_https" CHECK ("affiliate_programs"."terms_url" is null or "affiliate_programs"."terms_url" ~ '^https://[^/ ]+\.[^/ ]+'),
	CONSTRAINT "affiliate_programs_source_https" CHECK ("affiliate_programs"."source_url" is null or "affiliate_programs"."source_url" ~ '^https://[^/ ]+\.[^/ ]+'),
	CONSTRAINT "affiliate_programs_unavailable_cited" CHECK ("affiliate_programs"."status" <> 'unavailable' or ("affiliate_programs"."source_url" is not null and length(btrim(coalesce("affiliate_programs"."note", ''))) > 20))
);
--> statement-breakpoint
CREATE TABLE "submission_decisions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "submission_decisions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"submission_id" bigint NOT NULL,
	"decision" "submission_decision_kind" NOT NULL,
	"decided_by" bigint,
	"internal_note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tool_submissions" (
	"id" bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "tool_submissions_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1),
	"public_id" uuid DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"website_url" text NOT NULL,
	"website_host" text NOT NULL,
	"company" text NOT NULL,
	"category_id" bigint,
	"description" text NOT NULL,
	"features" text NOT NULL,
	"pricing_url" text NOT NULL,
	"submitter_name" text,
	"contact_email" text,
	"status" "submission_status" DEFAULT 'new' NOT NULL,
	"source" "submission_source" DEFAULT 'web' NOT NULL,
	"duplicate_of_tool_id" bigint,
	"resulting_tool_id" bigint,
	"ip_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tool_submissions_website_https" CHECK ("tool_submissions"."website_url" ~ '^https://[^/ ]+\.[^/ ]+'),
	CONSTRAINT "tool_submissions_pricing_https" CHECK ("tool_submissions"."pricing_url" ~ '^https://[^/ ]+\.[^/ ]+'),
	CONSTRAINT "tool_submissions_host_normalised" CHECK ("tool_submissions"."website_host" = lower("tool_submissions"."website_host") and "tool_submissions"."website_host" !~ '^www\.' and "tool_submissions"."website_host" ~ '\.'),
	CONSTRAINT "tool_submissions_lengths" CHECK (length(btrim("tool_submissions"."name")) between 2 and 120 and length("tool_submissions"."description") between 30 and 4000 and length("tool_submissions"."features") between 10 and 4000),
	CONSTRAINT "tool_submissions_email_format" CHECK ("tool_submissions"."contact_email" is null or "tool_submissions"."contact_email" ~ '^[^@\s]+@[^@\s]+\.[^@\s]{2,}$'),
	CONSTRAINT "tool_submissions_duplicate_target" CHECK ("tool_submissions"."status" <> 'duplicate' or "tool_submissions"."duplicate_of_tool_id" is not null)
);
--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_member_id_team_members_id_fk" FOREIGN KEY ("actor_member_id") REFERENCES "public"."team_members"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_created_by_team_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_revisions" ADD CONSTRAINT "content_revisions_approved_by_team_members_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_permission_id_permissions_id_fk" FOREIGN KEY ("permission_id") REFERENCES "public"."permissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_role_id_roles_id_fk" FOREIGN KEY ("role_id") REFERENCES "public"."roles"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_created_by_team_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_updated_by_team_members_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_created_by_team_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" ADD CONSTRAINT "companies_updated_by_team_members_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pricing_plans" ADD CONSTRAINT "pricing_plans_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_alternatives" ADD CONSTRAINT "tool_alternatives_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_alternatives" ADD CONSTRAINT "tool_alternatives_alternative_tool_id_tools_id_fk" FOREIGN KEY ("alternative_tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_categories" ADD CONSTRAINT "tool_categories_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_categories" ADD CONSTRAINT "tool_categories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_sources" ADD CONSTRAINT "tool_sources_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_primary_category_id_categories_id_fk" FOREIGN KEY ("primary_category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_subcategory_id_categories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_created_by_team_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tools" ADD CONSTRAINT "tools_updated_by_team_members_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_checks" ADD CONSTRAINT "verification_checks_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "verification_checks" ADD CONSTRAINT "verification_checks_checked_by_team_members_id_fk" FOREIGN KEY ("checked_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "analytics_events" ADD CONSTRAINT "analytics_events_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_created_by_team_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_updated_by_team_members_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_updated_by_team_members_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_evidence" ADD CONSTRAINT "review_evidence_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_evidence" ADD CONSTRAINT "review_evidence_media_asset_id_media_assets_id_fk" FOREIGN KEY ("media_asset_id") REFERENCES "public"."media_assets"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_testing" ADD CONSTRAINT "review_testing_review_id_reviews_id_fk" FOREIGN KEY ("review_id") REFERENCES "public"."reviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_reviewer_member_id_team_members_id_fk" FOREIGN KEY ("reviewer_member_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_created_by_team_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_updated_by_team_members_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authors" ADD CONSTRAINT "authors_team_member_id_team_members_id_fk" FOREIGN KEY ("team_member_id") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authors" ADD CONSTRAINT "authors_created_by_team_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "authors" ADD CONSTRAINT "authors_updated_by_team_members_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tools" ADD CONSTRAINT "blog_post_tools_post_id_blog_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."blog_posts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_post_tools" ADD CONSTRAINT "blog_post_tools_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_author_id_authors_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."authors"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_featured_media_id_media_assets_id_fk" FOREIGN KEY ("featured_media_id") REFERENCES "public"."media_assets"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_created_by_team_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD CONSTRAINT "blog_posts_updated_by_team_members_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_blog_post_id_blog_posts_id_fk" FOREIGN KEY ("blog_post_id") REFERENCES "public"."blog_posts"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_left_tool_id_tools_id_fk" FOREIGN KEY ("left_tool_id") REFERENCES "public"."tools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_right_tool_id_tools_id_fk" FOREIGN KEY ("right_tool_id") REFERENCES "public"."tools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_created_by_team_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comparisons" ADD CONSTRAINT "comparisons_updated_by_team_members_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_tools" ADD CONSTRAINT "model_tools_model_id_models_id_fk" FOREIGN KEY ("model_id") REFERENCES "public"."models"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_tools" ADD CONSTRAINT "model_tools_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_created_by_team_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_updated_by_team_members_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_items" ADD CONSTRAINT "news_items_source_id_news_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."news_sources"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_items" ADD CONSTRAINT "news_items_same_story_as_id_news_items_id_fk" FOREIGN KEY ("same_story_as_id") REFERENCES "public"."news_items"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_items" ADD CONSTRAINT "news_items_source_verified_by_team_members_id_fk" FOREIGN KEY ("source_verified_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_items" ADD CONSTRAINT "news_items_created_by_team_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_items" ADD CONSTRAINT "news_items_updated_by_team_members_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_tools" ADD CONSTRAINT "news_tools_news_item_id_news_items_id_fk" FOREIGN KEY ("news_item_id") REFERENCES "public"."news_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "news_tools" ADD CONSTRAINT "news_tools_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roundup_picks" ADD CONSTRAINT "roundup_picks_roundup_id_roundups_id_fk" FOREIGN KEY ("roundup_id") REFERENCES "public"."roundups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roundup_picks" ADD CONSTRAINT "roundup_picks_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roundups" ADD CONSTRAINT "roundups_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roundups" ADD CONSTRAINT "roundups_created_by_team_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "roundups" ADD CONSTRAINT "roundups_updated_by_team_members_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_applications" ADD CONSTRAINT "affiliate_applications_program_id_affiliate_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."affiliate_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_applications" ADD CONSTRAINT "affiliate_applications_applied_by_team_members_id_fk" FOREIGN KEY ("applied_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_links" ADD CONSTRAINT "affiliate_links_program_id_affiliate_programs_id_fk" FOREIGN KEY ("program_id") REFERENCES "public"."affiliate_programs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_programs" ADD CONSTRAINT "affiliate_programs_tool_id_tools_id_fk" FOREIGN KEY ("tool_id") REFERENCES "public"."tools"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "affiliate_programs" ADD CONSTRAINT "affiliate_programs_updated_by_team_members_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_decisions" ADD CONSTRAINT "submission_decisions_submission_id_tool_submissions_id_fk" FOREIGN KEY ("submission_id") REFERENCES "public"."tool_submissions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "submission_decisions" ADD CONSTRAINT "submission_decisions_decided_by_team_members_id_fk" FOREIGN KEY ("decided_by") REFERENCES "public"."team_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_submissions" ADD CONSTRAINT "tool_submissions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_submissions" ADD CONSTRAINT "tool_submissions_duplicate_of_tool_id_tools_id_fk" FOREIGN KEY ("duplicate_of_tool_id") REFERENCES "public"."tools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tool_submissions" ADD CONSTRAINT "tool_submissions_resulting_tool_id_tools_id_fk" FOREIGN KEY ("resulting_tool_id") REFERENCES "public"."tools"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_logs_time_idx" ON "audit_logs" USING btree ("occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_member_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "content_revisions_state_idx" ON "content_revisions" USING btree ("state","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "role_permissions_permission_idx" ON "role_permissions" USING btree ("permission_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_email_key" ON "team_members" USING btree (lower("email"));--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_auth_user_key" ON "team_members" USING btree ("auth_user_id") WHERE "team_members"."auth_user_id" is not null;--> statement-breakpoint
CREATE INDEX "team_members_role_idx" ON "team_members" USING btree ("role_id");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_top_slug_key" ON "categories" USING btree ("slug") WHERE "categories"."parent_id" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_child_slug_key" ON "categories" USING btree ("parent_id","slug") WHERE "categories"."parent_id" is not null;--> statement-breakpoint
CREATE INDEX "categories_parent_idx" ON "categories" USING btree ("parent_id");--> statement-breakpoint
CREATE INDEX "categories_visible_idx" ON "categories" USING btree ("is_visible","sort_order");--> statement-breakpoint
CREATE UNIQUE INDEX "companies_name_key" ON "companies" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "pricing_plans_tool_idx" ON "pricing_plans" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "tool_alternatives_alt_idx" ON "tool_alternatives" USING btree ("alternative_tool_id");--> statement-breakpoint
CREATE INDEX "tool_categories_category_idx" ON "tool_categories" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "tool_sources_tool_idx" ON "tool_sources" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "tools_state_idx" ON "tools" USING btree ("status","deleted_at");--> statement-breakpoint
CREATE INDEX "tools_company_idx" ON "tools" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "tools_primary_category_idx" ON "tools" USING btree ("primary_category_id");--> statement-breakpoint
CREATE INDEX "tools_subcategory_idx" ON "tools" USING btree ("subcategory_id");--> statement-breakpoint
CREATE INDEX "tools_pricing_status_idx" ON "tools" USING btree ("pricing_status");--> statement-breakpoint
CREATE INDEX "tools_verification_status_idx" ON "tools" USING btree ("verification_status");--> statement-breakpoint
CREATE INDEX "tools_aliases_idx" ON "tools" USING gin ("aliases");--> statement-breakpoint
CREATE INDEX "verification_checks_tool_idx" ON "verification_checks" USING btree ("tool_id","checked_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "analytics_daily_event_idx" ON "analytics_daily" USING btree ("event","day" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "analytics_events_time_idx" ON "analytics_events" USING btree ("occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "analytics_events_event_idx" ON "analytics_events" USING btree ("event","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "analytics_events_tool_idx" ON "analytics_events" USING btree ("tool_id","occurred_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "media_assets_tool_idx" ON "media_assets" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "media_assets_kind_idx" ON "media_assets" USING btree ("kind");--> statement-breakpoint
CREATE INDEX "media_assets_sha_idx" ON "media_assets" USING btree ("sha256");--> statement-breakpoint
CREATE INDEX "rate_limit_hits_window_idx" ON "rate_limit_hits" USING btree ("window_start");--> statement-breakpoint
CREATE INDEX "review_evidence_review_idx" ON "review_evidence" USING btree ("review_id");--> statement-breakpoint
CREATE INDEX "reviews_tool_idx" ON "reviews" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "reviews_state_idx" ON "reviews" USING btree ("status","method");--> statement-breakpoint
CREATE INDEX "blog_post_tools_tool_idx" ON "blog_post_tools" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "blog_posts_state_idx" ON "blog_posts" USING btree ("status","published_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "blog_posts_topic_idx" ON "blog_posts" USING btree ("topic");--> statement-breakpoint
CREATE INDEX "model_tools_tool_idx" ON "model_tools" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "models_company_idx" ON "models" USING btree ("company_id");--> statement-breakpoint
CREATE INDEX "news_items_state_idx" ON "news_items" USING btree ("status","published_on" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "news_items_source_idx" ON "news_items" USING btree ("source_id");--> statement-breakpoint
CREATE UNIQUE INDEX "news_sources_name_key" ON "news_sources" USING btree (lower("name"));--> statement-breakpoint
CREATE INDEX "news_tools_tool_idx" ON "news_tools" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "roundup_picks_tool_idx" ON "roundup_picks" USING btree ("tool_id");--> statement-breakpoint
CREATE INDEX "affiliate_applications_program_idx" ON "affiliate_applications" USING btree ("program_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "affiliate_programs_status_idx" ON "affiliate_programs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "submission_decisions_submission_idx" ON "submission_decisions" USING btree ("submission_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE UNIQUE INDEX "tool_submissions_public_id_key" ON "tool_submissions" USING btree ("public_id");--> statement-breakpoint
CREATE UNIQUE INDEX "tool_submissions_open_host_key" ON "tool_submissions" USING btree ("website_host") WHERE "tool_submissions"."status" in ('new', 'in_review', 'approved');--> statement-breakpoint
CREATE INDEX "tool_submissions_status_idx" ON "tool_submissions" USING btree ("status","created_at" DESC NULLS LAST);