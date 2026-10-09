ALTER TABLE public.companies ADD COLUMN status_revision integer NOT NULL DEFAULT 0 CHECK (status_revision >= 0);
--> statement-breakpoint
CREATE TABLE public.company_status_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
 actor_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
 from_status public.company_status NOT NULL,
 to_status public.company_status NOT NULL,
 status_revision integer NOT NULL CHECK (status_revision > 0),
 changed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CHECK (from_status <> to_status),
 UNIQUE (company_id,status_revision)
);
--> statement-breakpoint
ALTER TABLE public.company_status_events ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON public.company_status_events FROM anon,authenticated;
