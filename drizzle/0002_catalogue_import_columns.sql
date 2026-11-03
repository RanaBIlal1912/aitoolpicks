ALTER TABLE "tool_sources" DROP CONSTRAINT "tool_sources_tool_url_key";--> statement-breakpoint
ALTER TABLE "tool_categories" ADD COLUMN "position" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "tool_sources" ADD COLUMN "position" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "tools" ADD COLUMN "catalog_verified_on" date;--> statement-breakpoint
ALTER TABLE "tool_sources" ADD CONSTRAINT "tool_sources_tool_position_key" UNIQUE("tool_id","position");