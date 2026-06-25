CREATE TABLE "media_event_outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "media_event_outbox_status_check" CHECK ("status" in ('pending', 'published', 'failed'))
);
--> statement-breakpoint
CREATE INDEX "media_event_outbox_status_created_at_idx" ON "media_event_outbox" USING btree ("status","created_at");--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_media_type_check" CHECK ("media_type" in ('image', 'video'));--> statement-breakpoint
ALTER TABLE "media_assets" ADD CONSTRAINT "media_assets_status_check" CHECK ("status" in ('uploaded', 'processing', 'processed', 'failed'));--> statement-breakpoint
ALTER TABLE "media_variants" ADD CONSTRAINT "media_variants_variant_type_check" CHECK ("variant_type" in ('original', 'image_large', 'image_thumbnail', 'video_poster', 'video_mp4'));--> statement-breakpoint
CREATE UNIQUE INDEX "media_variants_media_variant_type_unique" ON "media_variants" USING btree ("media_id","variant_type");
