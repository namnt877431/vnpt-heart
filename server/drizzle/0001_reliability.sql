CREATE TABLE "error_reports" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"fingerprint" text NOT NULL,
	"source" text NOT NULL,
	"message" text NOT NULL,
	"stack" text DEFAULT '' NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"user_agent" text DEFAULT '' NOT NULL,
	"release" text DEFAULT '' NOT NULL,
	"last_user_id" uuid,
	"count" integer DEFAULT 1 NOT NULL,
	"first_seen" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "error_reports_fingerprint_unique" UNIQUE("fingerprint")
);
--> statement-breakpoint
ALTER TABLE "plays" ADD COLUMN "client_id" text;--> statement-breakpoint
ALTER TABLE "error_reports" ADD CONSTRAINT "error_reports_last_user_id_users_id_fk" FOREIGN KEY ("last_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "error_reports_last_seen_idx" ON "error_reports" USING btree ("last_seen");--> statement-breakpoint
CREATE UNIQUE INDEX "plays_client_id_idx" ON "plays" USING btree ("user_id","client_id");