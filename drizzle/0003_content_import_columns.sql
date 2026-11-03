ALTER TABLE "tools" ADD COLUMN "review_slug" text;--> statement-breakpoint
ALTER TABLE "reviews" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "region" text;--> statement-breakpoint
ALTER TABLE "blog_posts" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "comparisons" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "model_tools" ADD COLUMN "position" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD COLUMN "news_item_id" bigint;--> statement-breakpoint
ALTER TABLE "news_items" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "news_tools" ADD COLUMN "position" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE "roundups" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "models" ADD CONSTRAINT "models_news_item_id_news_items_id_fk" FOREIGN KEY ("news_item_id") REFERENCES "public"."news_items"("id") ON DELETE set null ON UPDATE no action;