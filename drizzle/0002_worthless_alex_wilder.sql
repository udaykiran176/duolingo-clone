CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"link" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_progress" ALTER COLUMN "user_image_src" SET DEFAULT '/smartbit-logo.svg';--> statement-breakpoint
CREATE INDEX "announcements_is_active_idx" ON "announcements" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "challenge_options_challenge_id_idx" ON "challenge_options" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "challenge_progress_user_id_idx" ON "challenge_progress" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "challenge_progress_challenge_id_idx" ON "challenge_progress" USING btree ("challenge_id");--> statement-breakpoint
CREATE INDEX "challenge_progress_user_challenge_idx" ON "challenge_progress" USING btree ("user_id","challenge_id");--> statement-breakpoint
CREATE INDEX "challenges_lesson_id_idx" ON "challenges" USING btree ("lesson_id");--> statement-breakpoint
CREATE INDEX "lessons_unit_id_idx" ON "lessons" USING btree ("unit_id");