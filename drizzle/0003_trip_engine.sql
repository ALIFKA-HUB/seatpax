ALTER TABLE "memberships" ADD CONSTRAINT "membership_trip_identity" UNIQUE("id","user_id","company_id","role");
--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_tenant_key" UNIQUE("id","company_id");
--> statement-breakpoint
CREATE TYPE "public"."crew_assignment_status" AS ENUM('ACTIVE', 'REVOKED');--> statement-breakpoint
CREATE TYPE "public"."trip_audit_action" AS ENUM('PUBLICATION', 'CREW_ASSIGNED', 'CREW_REVOKED');--> statement-breakpoint
CREATE TYPE "public"."trip_status" AS ENUM('DRAFT', 'OPEN_FOR_SALE');--> statement-breakpoint
CREATE TABLE "trip_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"trip_id" uuid NOT NULL,
	"actor_id" uuid NOT NULL,
	"action" "trip_audit_action" NOT NULL,
	"target_user_id" uuid,
	"metadata" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "trip_audit_events" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trip_crew_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"trip_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"membership_role" "membership_role" DEFAULT 'CREW' NOT NULL,
	"status" "crew_assignment_status" DEFAULT 'ACTIVE' NOT NULL,
	"assigned_by" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone,
	CONSTRAINT "trip_crew_pair" UNIQUE("trip_id","user_id"),
	CONSTRAINT "trip_crew_role" CHECK ("trip_crew_assignments"."membership_role"='CREW'),
	CONSTRAINT "trip_crew_revocation" CHECK (("trip_crew_assignments"."status"='ACTIVE' AND "trip_crew_assignments"."revoked_at" IS NULL) OR ("trip_crew_assignments"."status"='REVOKED' AND "trip_crew_assignments"."revoked_at" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "trip_crew_assignments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trip_seat_inventory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"trip_id" uuid NOT NULL,
	"trip_seat_id" uuid NOT NULL,
	"trip_segment_id" uuid NOT NULL,
	CONSTRAINT "trip_inventory_unit" UNIQUE("trip_id","trip_seat_id","trip_segment_id")
);
--> statement-breakpoint
ALTER TABLE "trip_seat_inventory" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trip_seats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"trip_id" uuid NOT NULL,
	"seat_code" text NOT NULL,
	"row_index" integer NOT NULL,
	"col_index" integer NOT NULL,
	"label" text,
	CONSTRAINT "trip_seat_identity" UNIQUE("id","trip_id","company_id"),
	CONSTRAINT "trip_seat_code" UNIQUE("trip_id","seat_code"),
	CONSTRAINT "trip_seat_coordinate" UNIQUE("trip_id","row_index","col_index"),
	CONSTRAINT "trip_seat_values" CHECK ("trip_seats"."row_index" BETWEEN 0 AND 29 AND "trip_seats"."col_index" BETWEEN 0 AND 7 AND "trip_seats"."seat_code" ~ '^[A-Z0-9-]{1,8}$')
);
--> statement-breakpoint
ALTER TABLE "trip_seats" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trip_segments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"trip_id" uuid NOT NULL,
	"from_trip_stop_id" uuid NOT NULL,
	"to_trip_stop_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"price" bigint NOT NULL,
	"currency" text DEFAULT 'IDR' NOT NULL,
	CONSTRAINT "trip_segment_identity" UNIQUE("id","trip_id","company_id"),
	CONSTRAINT "trip_segment_sequence" UNIQUE("trip_id","sequence"),
	CONSTRAINT "trip_segment_values" CHECK ("trip_segments"."sequence">0 AND "trip_segments"."price">=0 AND "trip_segments"."currency"='IDR' AND "trip_segments"."from_trip_stop_id"<>"trip_segments"."to_trip_stop_id")
);
--> statement-breakpoint
ALTER TABLE "trip_segments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trip_stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"trip_id" uuid NOT NULL,
	"source_id" uuid NOT NULL,
	"stop_id" uuid NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"address" text,
	"sequence" integer NOT NULL,
	"arrival_at" timestamp with time zone NOT NULL,
	"departure_at" timestamp with time zone NOT NULL,
	CONSTRAINT "trip_stop_identity" UNIQUE("id","trip_id","company_id"),
	CONSTRAINT "trip_stop_sequence" UNIQUE("trip_id","sequence"),
	CONSTRAINT "trip_stop_positive" CHECK ("trip_stops"."sequence">0),
	CONSTRAINT "trip_stop_time_order" CHECK ("trip_stops"."arrival_at"<="trip_stops"."departure_at")
);
--> statement-breakpoint
ALTER TABLE "trip_stops" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "trips" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"route_id" uuid NOT NULL,
	"vehicle_id" uuid NOT NULL,
	"service_class_id" uuid NOT NULL,
	"departure_at" timestamp with time zone NOT NULL,
	"sales_close_at" timestamp with time zone,
	"revision" integer DEFAULT 1 NOT NULL,
	"status" "trip_status" DEFAULT 'DRAFT' NOT NULL,
	"published_at" timestamp with time zone,
	"layout_snapshot" jsonb,
	"identity_snapshot" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trips_tenant_key" UNIQUE("id","company_id"),
	CONSTRAINT "trip_revision_positive" CHECK ("trips"."revision">0),
	CONSTRAINT "trip_name_valid" CHECK (length(trim("trips"."name")) BETWEEN 1 AND 120),
	CONSTRAINT "trip_publication_state" CHECK (("trips"."status"='DRAFT' AND "trips"."published_at" IS NULL AND "trips"."layout_snapshot" IS NULL AND "trips"."identity_snapshot" IS NULL) OR ("trips"."status"='OPEN_FOR_SALE' AND "trips"."published_at" IS NOT NULL AND "trips"."layout_snapshot" IS NOT NULL AND "trips"."identity_snapshot" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "trips" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "trip_audit_events" ADD CONSTRAINT "trip_audit_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_audit_events" ADD CONSTRAINT "trip_audit_events_target_user_id_users_id_fk" FOREIGN KEY ("target_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_audit_events" ADD CONSTRAINT "trip_audit_events_trip_id_company_id_trips_id_company_id_fk" FOREIGN KEY ("trip_id","company_id") REFERENCES "public"."trips"("id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_crew_assignments" ADD CONSTRAINT "trip_crew_assignments_assigned_by_users_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_crew_assignments" ADD CONSTRAINT "trip_crew_assignments_trip_id_company_id_trips_id_company_id_fk" FOREIGN KEY ("trip_id","company_id") REFERENCES "public"."trips"("id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_crew_assignments" ADD CONSTRAINT "trip_crew_assignments_membership_id_user_id_company_id_membership_role_memberships_id_user_id_company_id_role_fk" FOREIGN KEY ("membership_id","user_id","company_id","membership_role") REFERENCES "public"."memberships"("id","user_id","company_id","role") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_seat_inventory" ADD CONSTRAINT "trip_seat_inventory_trip_seat_id_trip_id_company_id_trip_seats_id_trip_id_company_id_fk" FOREIGN KEY ("trip_seat_id","trip_id","company_id") REFERENCES "public"."trip_seats"("id","trip_id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_seat_inventory" ADD CONSTRAINT "trip_seat_inventory_trip_segment_id_trip_id_company_id_trip_segments_id_trip_id_company_id_fk" FOREIGN KEY ("trip_segment_id","trip_id","company_id") REFERENCES "public"."trip_segments"("id","trip_id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_seats" ADD CONSTRAINT "trip_seats_trip_id_company_id_trips_id_company_id_fk" FOREIGN KEY ("trip_id","company_id") REFERENCES "public"."trips"("id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_segments" ADD CONSTRAINT "trip_segments_from_trip_stop_id_trip_id_company_id_trip_stops_id_trip_id_company_id_fk" FOREIGN KEY ("from_trip_stop_id","trip_id","company_id") REFERENCES "public"."trip_stops"("id","trip_id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_segments" ADD CONSTRAINT "trip_segments_to_trip_stop_id_trip_id_company_id_trip_stops_id_trip_id_company_id_fk" FOREIGN KEY ("to_trip_stop_id","trip_id","company_id") REFERENCES "public"."trip_stops"("id","trip_id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trip_stops" ADD CONSTRAINT "trip_stops_trip_id_company_id_trips_id_company_id_fk" FOREIGN KEY ("trip_id","company_id") REFERENCES "public"."trips"("id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_route_id_company_id_routes_id_company_id_fk" FOREIGN KEY ("route_id","company_id") REFERENCES "public"."routes"("id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_vehicle_id_company_id_vehicles_id_company_id_fk" FOREIGN KEY ("vehicle_id","company_id") REFERENCES "public"."vehicles"("id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trips" ADD CONSTRAINT "trips_service_class_id_company_id_service_classes_id_company_id_fk" FOREIGN KEY ("service_class_id","company_id") REFERENCES "public"."service_classes"("id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
--> statement-breakpoint

--> statement-breakpoint
REVOKE ALL ON TABLE public.trips, public.trip_stops, public.trip_segments, public.trip_seats, public.trip_seat_inventory, public.trip_crew_assignments, public.trip_audit_events FROM anon, authenticated;

