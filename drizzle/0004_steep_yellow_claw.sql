ALTER TABLE "challenge_options" ADD COLUMN "order" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "challenges" ADD COLUMN "random_order" boolean DEFAULT false NOT NULL;