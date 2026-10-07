CREATE TYPE "public"."seat_cell_type" AS ENUM('SEAT', 'DRIVER', 'AISLE', 'DOOR', 'EMPTY', 'FACILITY');--> statement-breakpoint
CREATE TYPE "public"."seat_template_status" AS ENUM('ACTIVE', 'ARCHIVED');--> statement-breakpoint
CREATE TYPE "public"."vehicle_status" AS ENUM('ACTIVE', 'MAINTENANCE', 'INACTIVE');--> statement-breakpoint
CREATE TABLE "seat_template_cells" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"seat_template_id" uuid NOT NULL,
	"row_index" integer NOT NULL,
	"col_index" integer NOT NULL,
	"type" "seat_cell_type" NOT NULL,
	"label" text,
	"seat_code" text,
	CONSTRAINT "seat_cell_coordinate" UNIQUE("seat_template_id","row_index","col_index"),
	CONSTRAINT "seat_cell_code" UNIQUE("seat_template_id","seat_code"),
	CONSTRAINT "seat_cell_bounds" CHECK ("seat_template_cells"."row_index" BETWEEN 0 AND 29 AND "seat_template_cells"."col_index" BETWEEN 0 AND 7),
	CONSTRAINT "seat_cell_label" CHECK ("seat_template_cells"."label" IS NULL OR length("seat_template_cells"."label")<=40),
	CONSTRAINT "seat_cell_code_type" CHECK (("seat_template_cells"."type"='SEAT' AND "seat_template_cells"."seat_code" IS NOT NULL AND "seat_template_cells"."seat_code" ~ '^[A-Z0-9-]{1,8}$') OR ("seat_template_cells"."type"<>'SEAT' AND "seat_template_cells"."seat_code" IS NULL))
);
--> statement-breakpoint
ALTER TABLE "seat_template_cells" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "seat_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"rows" integer NOT NULL,
	"cols" integer NOT NULL,
	"status" "seat_template_status" DEFAULT 'ACTIVE' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "seat_templates_tenant_key" UNIQUE("id","company_id"),
	CONSTRAINT "seat_template_dimensions" CHECK ("seat_templates"."rows" BETWEEN 1 AND 30 AND "seat_templates"."cols" BETWEEN 1 AND 8),
	CONSTRAINT "seat_template_version" CHECK ("seat_templates"."version">0),
	CONSTRAINT "seat_template_name" CHECK (length(trim("seat_templates"."name")) BETWEEN 1 AND 120)
);
--> statement-breakpoint
ALTER TABLE "seat_templates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "vehicles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"name" text NOT NULL,
	"plate_number" text NOT NULL,
	"fleet_number" text,
	"seat_template_id" uuid NOT NULL,
	"default_service_class_id" uuid NOT NULL,
	"status" "vehicle_status" DEFAULT 'ACTIVE' NOT NULL,
	"revision" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "vehicles_company_plate" UNIQUE("company_id","plate_number"),
	CONSTRAINT "vehicle_revision" CHECK ("vehicles"."revision">0),
	CONSTRAINT "vehicle_name" CHECK (length(trim("vehicles"."name")) BETWEEN 1 AND 120),
	CONSTRAINT "vehicle_plate" CHECK ("vehicles"."plate_number" ~ '^[A-Z0-9 -]{1,24}$' AND "vehicles"."plate_number"=trim("vehicles"."plate_number") AND "vehicles"."plate_number" NOT LIKE '%  %'),
	CONSTRAINT "vehicle_fleet_number" CHECK ("vehicles"."fleet_number" IS NULL OR length("vehicles"."fleet_number")<=32)
);
--> statement-breakpoint
ALTER TABLE "vehicles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "seat_template_cells" ADD CONSTRAINT "seat_template_cells_seat_template_id_company_id_seat_templates_id_company_id_fk" FOREIGN KEY ("seat_template_id","company_id") REFERENCES "public"."seat_templates"("id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "seat_templates" ADD CONSTRAINT "seat_templates_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_seat_template_id_company_id_seat_templates_id_company_id_fk" FOREIGN KEY ("seat_template_id","company_id") REFERENCES "public"."seat_templates"("id","company_id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_default_service_class_id_company_id_service_classes_id_company_id_fk" FOREIGN KEY ("default_service_class_id","company_id") REFERENCES "public"."service_classes"("id","company_id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
REVOKE ALL ON TABLE public.seat_templates, public.seat_template_cells, public.vehicles FROM anon, authenticated;
