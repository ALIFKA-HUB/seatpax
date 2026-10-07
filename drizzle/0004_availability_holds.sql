CREATE TYPE "public"."hold_audit_action" AS ENUM('HOLD_CREATED', 'HOLD_RELEASED', 'HOLD_EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."hold_status" AS ENUM('ACTIVE', 'RELEASED', 'EXPIRED', 'CONVERTED');--> statement-breakpoint
CREATE TABLE "seat_hold_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"trip_id" uuid NOT NULL,
	"hold_id" uuid NOT NULL,
	"actor_id" uuid,
	"action" "hold_audit_action" NOT NULL,
	"metadata" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	CONSTRAINT "hold_transition_audit" UNIQUE("hold_id","action")
);
--> statement-breakpoint
ALTER TABLE "seat_hold_audit_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "seat_holds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"trip_id" uuid NOT NULL,
	"trip_seat_id" uuid NOT NULL,
	"from_trip_stop_id" uuid NOT NULL,
	"to_trip_stop_id" uuid NOT NULL,
	"from_sequence" integer NOT NULL,
	"to_sequence" integer NOT NULL,
	"held_by_user_id" uuid NOT NULL,
	"request_key" uuid NOT NULL,
	"status" "hold_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"base_expires_at" timestamp with time zone NOT NULL,
	"effective_expires_at" timestamp with time zone NOT NULL,
	"payment_initiated_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"expired_at" timestamp with time zone,
	CONSTRAINT "hold_owner_request" UNIQUE("held_by_user_id","request_key"),
	CONSTRAINT "hold_identity" UNIQUE("id","trip_id","company_id"),
	CONSTRAINT "hold_range" CHECK ("seat_holds"."from_sequence">0 AND "seat_holds"."to_sequence">"seat_holds"."from_sequence"),
	CONSTRAINT "hold_times" CHECK ("seat_holds"."base_expires_at"="seat_holds"."created_at"+interval '10 minutes' AND "seat_holds"."effective_expires_at">="seat_holds"."base_expires_at" AND ("seat_holds"."payment_initiated_at" IS NULL OR "seat_holds"."payment_initiated_at">="seat_holds"."created_at")),
	CONSTRAINT "hold_state" CHECK (("seat_holds"."status" IN ('ACTIVE','CONVERTED') AND "seat_holds"."released_at" IS NULL AND "seat_holds"."expired_at" IS NULL) OR ("seat_holds"."status"='RELEASED' AND "seat_holds"."released_at">="seat_holds"."created_at" AND "seat_holds"."expired_at" IS NULL) OR ("seat_holds"."status"='EXPIRED' AND "seat_holds"."expired_at">="seat_holds"."effective_expires_at" AND "seat_holds"."released_at" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "seat_holds" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "seat_hold_audit_events" ADD CONSTRAINT "seat_hold_audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_hold_audit_events" ADD CONSTRAINT "seat_hold_audit_events_hold_id_trip_id_company_id_seat_holds_id_trip_id_company_id_fk" FOREIGN KEY ("hold_id","trip_id","company_id") REFERENCES "public"."seat_holds"("id","trip_id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_holds" ADD CONSTRAINT "seat_holds_held_by_user_id_users_id_fk" FOREIGN KEY ("held_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_holds" ADD CONSTRAINT "seat_holds_trip_seat_id_trip_id_company_id_trip_seats_id_trip_id_company_id_fk" FOREIGN KEY ("trip_seat_id","trip_id","company_id") REFERENCES "public"."trip_seats"("id","trip_id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_holds" ADD CONSTRAINT "seat_holds_from_trip_stop_id_trip_id_company_id_trip_stops_id_trip_id_company_id_fk" FOREIGN KEY ("from_trip_stop_id","trip_id","company_id") REFERENCES "public"."trip_stops"("id","trip_id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_holds" ADD CONSTRAINT "seat_holds_to_trip_stop_id_trip_id_company_id_trip_stops_id_trip_id_company_id_fk" FOREIGN KEY ("to_trip_stop_id","trip_id","company_id") REFERENCES "public"."trip_stops"("id","trip_id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "hold_active_seat" ON "seat_holds" USING btree ("trip_id","trip_seat_id","from_sequence","to_sequence") WHERE "seat_holds"."status"='ACTIVE';--> statement-breakpoint
CREATE INDEX "hold_expiry" ON "seat_holds" USING btree ("effective_expires_at") WHERE "seat_holds"."status"='ACTIVE';
--> statement-breakpoint
REVOKE ALL ON public.seat_holds, public.seat_hold_audit_events FROM anon, authenticated;
