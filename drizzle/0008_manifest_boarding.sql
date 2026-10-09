ALTER TABLE public.tickets ADD CONSTRAINT tickets_trip_company_identity UNIQUE(id,trip_id,company_id);
--> statement-breakpoint
CREATE TABLE public.boarding_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL,
 trip_id uuid NOT NULL,
 ticket_id uuid NOT NULL,
 boarding_stop_id uuid NOT NULL,
 actor_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
 source text NOT NULL CHECK(source IN ('QR','MANIFEST')),
 boarded_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CONSTRAINT boarding_once UNIQUE(ticket_id,trip_id),
 CONSTRAINT boarding_ticket_identity FOREIGN KEY(ticket_id,trip_id,company_id) REFERENCES public.tickets(id,trip_id,company_id) ON DELETE RESTRICT,
 CONSTRAINT boarding_stop_identity FOREIGN KEY(boarding_stop_id,trip_id,company_id) REFERENCES public.trip_stops(id,trip_id,company_id) ON DELETE RESTRICT
);
--> statement-breakpoint
ALTER TABLE public.boarding_events ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON public.boarding_events FROM anon, authenticated;
