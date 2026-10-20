-- Custom SQL migration file, put your code below! --
CREATE TYPE public.region_import_state AS ENUM ('FETCHING','SUCCEEDED','FAILED');
--> statement-breakpoint
CREATE TABLE public.region_import_runs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider text NOT NULL,
 state public.region_import_state NOT NULL, source_urls text[] NOT NULL,
 upstream_date date, retrieved_at timestamptz NOT NULL, finished_at timestamptz,
 digest text, province_count integer NOT NULL DEFAULT 0, regency_count integer NOT NULL DEFAULT 0, failure_code text,
 CONSTRAINT region_counts_valid CHECK(province_count>=0 AND regency_count>=0),
 CONSTRAINT region_digest_valid CHECK(digest IS NULL OR digest ~ '^[a-f0-9]{64}$')
);
--> statement-breakpoint
CREATE INDEX region_runs_provider_date ON public.region_import_runs(provider,upstream_date);
--> statement-breakpoint
CREATE TABLE public.region_provinces (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider text NOT NULL, code text NOT NULL, name text NOT NULL,
 active boolean NOT NULL, last_seen_run_id uuid NOT NULL REFERENCES public.region_import_runs(id) ON DELETE RESTRICT,
 CONSTRAINT region_province_code UNIQUE(provider,code), CONSTRAINT region_province_provider_id UNIQUE(provider,id)
);
--> statement-breakpoint
CREATE INDEX region_province_run ON public.region_provinces(last_seen_run_id);
--> statement-breakpoint
CREATE TABLE public.region_regencies (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), provider text NOT NULL, code text NOT NULL, name text NOT NULL,
 province_id uuid NOT NULL, active boolean NOT NULL, last_seen_run_id uuid NOT NULL REFERENCES public.region_import_runs(id) ON DELETE RESTRICT,
 CONSTRAINT region_regency_code UNIQUE(provider,code),
 FOREIGN KEY(provider,province_id) REFERENCES public.region_provinces(provider,id) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE INDEX region_regency_province ON public.region_regencies(province_id);
--> statement-breakpoint
CREATE INDEX region_regency_run ON public.region_regencies(last_seen_run_id);
--> statement-breakpoint
ALTER TABLE public.stops ADD COLUMN region_regency_id uuid REFERENCES public.region_regencies(id) ON DELETE RESTRICT;
--> statement-breakpoint
CREATE INDEX stops_region_regency ON public.stops(region_regency_id);
--> statement-breakpoint
ALTER TABLE public.region_import_runs ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.region_provinces ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
ALTER TABLE public.region_regencies ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON public.region_import_runs,public.region_provinces,public.region_regencies FROM PUBLIC,anon,authenticated;
