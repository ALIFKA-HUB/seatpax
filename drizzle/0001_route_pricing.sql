CREATE TYPE "public"."template_status" AS ENUM('ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TABLE "route_stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"route_id" uuid NOT NULL,
	"stop_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"arrival_offset_min" integer,
	"departure_offset_min" integer,
	CONSTRAINT "route_stops_endpoint_key" UNIQUE("id","route_id","company_id"),
	CONSTRAINT "route_stops_sequence" UNIQUE("route_id","sequence"),
	CONSTRAINT "route_stops_stop" UNIQUE("route_id","stop_id"),
	CONSTRAINT "route_stop_sequence_positive" CHECK ("route_stops"."sequence">=1),
	CONSTRAINT "route_stop_offsets" CHECK (("route_stops"."arrival_offset_min" IS NULL OR "route_stops"."arrival_offset_min" BETWEEN 0 AND 10080) AND ("route_stops"."departure_offset_min" IS NULL OR "route_stops"."departure_offset_min" BETWEEN 0 AND 10080) AND ("route_stops"."arrival_offset_min" IS NULL OR "route_stops"."departure_offset_min" IS NULL OR "route_stops"."arrival_offset_min"<="route_stops"."departure_offset_min"))
);
--> statement-breakpoint
ALTER TABLE "route_stops" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text,
	"status" "template_status" DEFAULT 'ACTIVE' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "routes_tenant_key" UNIQUE("id","company_id"),
	CONSTRAINT "route_revision_positive" CHECK ("routes"."revision">0)
);
--> statement-breakpoint
ALTER TABLE "routes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "segment_fares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"route_id" uuid NOT NULL,
	"from_route_stop_id" uuid NOT NULL,
	"to_route_stop_id" uuid NOT NULL,
	"service_class_id" uuid NOT NULL,
	"price" bigint NOT NULL,
	"currency" text DEFAULT 'IDR' NOT NULL,
	CONSTRAINT "fare_segment_class" UNIQUE("route_id","from_route_stop_id","to_route_stop_id","service_class_id"),
	CONSTRAINT "fare_nonnegative" CHECK ("segment_fares"."price">=0),
	CONSTRAINT "fare_currency" CHECK ("segment_fares"."currency"='IDR'),
	CONSTRAINT "fare_endpoints_different" CHECK ("segment_fares"."from_route_stop_id"<>"segment_fares"."to_route_stop_id")
);
--> statement-breakpoint
ALTER TABLE "segment_fares" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "service_classes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"status" "template_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "classes_tenant_key" UNIQUE("id","company_id"),
	CONSTRAINT "classes_company_code" UNIQUE("company_id","code")
);
--> statement-breakpoint
ALTER TABLE "service_classes" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "stops" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"city" text NOT NULL,
	"address" text,
	"status" "template_status" DEFAULT 'ACTIVE' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stops_tenant_key" UNIQUE("id","company_id")
);
--> statement-breakpoint
ALTER TABLE "stops" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_route_id_company_id_routes_id_company_id_fk" FOREIGN KEY ("route_id","company_id") REFERENCES "public"."routes"("id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_stops" ADD CONSTRAINT "route_stops_stop_id_company_id_stops_id_company_id_fk" FOREIGN KEY ("stop_id","company_id") REFERENCES "public"."stops"("id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routes" ADD CONSTRAINT "routes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segment_fares" ADD CONSTRAINT "segment_fares_from_route_stop_id_route_id_company_id_route_stops_id_route_id_company_id_fk" FOREIGN KEY ("from_route_stop_id","route_id","company_id") REFERENCES "public"."route_stops"("id","route_id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segment_fares" ADD CONSTRAINT "segment_fares_to_route_stop_id_route_id_company_id_route_stops_id_route_id_company_id_fk" FOREIGN KEY ("to_route_stop_id","route_id","company_id") REFERENCES "public"."route_stops"("id","route_id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "segment_fares" ADD CONSTRAINT "segment_fares_service_class_id_company_id_service_classes_id_company_id_fk" FOREIGN KEY ("service_class_id","company_id") REFERENCES "public"."service_classes"("id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "service_classes" ADD CONSTRAINT "service_classes_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stops" ADD CONSTRAINT "stops_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
REVOKE ALL PRIVILEGES ON TABLE public.stops,public.routes,public.route_stops,public.service_classes,public.segment_fares FROM anon,authenticated;
