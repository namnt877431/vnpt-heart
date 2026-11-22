CREATE TABLE "error_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"report_id" bigint NOT NULL,
	"user_id" uuid,
	"user_agent" text DEFAULT '' NOT NULL,
	"browser" text DEFAULT '' NOT NULL,
	"url" text DEFAULT '' NOT NULL,
	"release" text DEFAULT '' NOT NULL,
	"detail" text DEFAULT '' NOT NULL,
	"ip" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "error_reports" ADD COLUMN "category" text DEFAULT 'browser' NOT NULL;--> statement-breakpoint
ALTER TABLE "error_events" ADD CONSTRAINT "error_events_report_id_error_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."error_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "error_events" ADD CONSTRAINT "error_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "error_events_report_idx" ON "error_events" USING btree ("report_id","created_at");--> statement-breakpoint
CREATE INDEX "error_events_user_idx" ON "error_events" USING btree ("user_id");--> statement-breakpoint
UPDATE "error_reports" SET "category" = 'server' WHERE "source" = 'server';