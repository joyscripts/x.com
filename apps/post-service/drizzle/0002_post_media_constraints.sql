CREATE UNIQUE INDEX "post_media_post_id_position_unique" ON "post_media" USING btree ("post_id","position");--> statement-breakpoint
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_media_type_check" CHECK ("media_type" in ('image', 'video'));--> statement-breakpoint
ALTER TABLE "post_media" ADD CONSTRAINT "post_media_position_check" CHECK ("position" between 0 and 3);
