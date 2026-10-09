ALTER TABLE public.boarding_events ADD CONSTRAINT boarding_ticket_trip_company UNIQUE(ticket_id,trip_id,company_id);
--> statement-breakpoint
CREATE TABLE public.snack_claims (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 company_id uuid NOT NULL,
 trip_id uuid NOT NULL,
 ticket_id uuid NOT NULL,
 actor_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
 claimed_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 CONSTRAINT snack_once UNIQUE(ticket_id,trip_id),
 CONSTRAINT snack_ticket_identity FOREIGN KEY(ticket_id,trip_id,company_id) REFERENCES public.tickets(id,trip_id,company_id) ON DELETE RESTRICT,
 CONSTRAINT snack_boarding_identity FOREIGN KEY(ticket_id,trip_id,company_id) REFERENCES public.boarding_events(ticket_id,trip_id,company_id) ON DELETE RESTRICT
);
--> statement-breakpoint
ALTER TABLE public.snack_claims ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
REVOKE ALL ON public.snack_claims FROM anon, authenticated;
