ALTER TABLE public.users ADD COLUMN phone text;
--> statement-breakpoint
ALTER TABLE public.seat_holds ADD CONSTRAINT hold_booker_identity UNIQUE(id,trip_id,company_id,held_by_user_id);
--> statement-breakpoint
CREATE TABLE public.bookings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL, trip_id uuid NOT NULL, seat_hold_id uuid NOT NULL UNIQUE,
 booker_user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT, request_key uuid NOT NULL, payload_hash text NOT NULL,
 mode text NOT NULL CHECK(mode IN ('SELF','OTHER')), contact_email text NOT NULL, amount bigint NOT NULL CHECK(amount>0 AND amount<=9007199254740991),
 snapshot jsonb NOT NULL CHECK(jsonb_typeof(snapshot)='object'), status text NOT NULL DEFAULT 'PENDING_PAYMENT' CHECK(status IN ('PENDING_PAYMENT','EXPIRED','CONFIRMED','PAYMENT_CONFLICT','REFUNDED')),
 created_at timestamptz NOT NULL DEFAULT clock_timestamp(), confirmed_at timestamptz,
 UNIQUE(booker_user_id,request_key), UNIQUE(id,trip_id,company_id), UNIQUE(id,trip_id,company_id,booker_user_id,mode),
 FOREIGN KEY(seat_hold_id,trip_id,company_id,booker_user_id) REFERENCES public.seat_holds(id,trip_id,company_id,held_by_user_id) ON DELETE RESTRICT,
 CHECK((status='CONFIRMED' AND confirmed_at IS NOT NULL AND confirmed_at>=created_at) OR (status<>'CONFIRMED' AND confirmed_at IS NULL))
);
--> statement-breakpoint
CREATE TABLE public.booking_passengers (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), booking_id uuid NOT NULL UNIQUE, company_id uuid NOT NULL,trip_id uuid NOT NULL,booker_user_id uuid NOT NULL,mode text NOT NULL,
 account_id uuid REFERENCES public.users(id) ON DELETE RESTRICT, name text NOT NULL CHECK(length(trim(name)) BETWEEN 1 AND 120),phone text NOT NULL CHECK(phone ~ '^\+[1-9][0-9]{7,14}$'),
 UNIQUE(id,trip_id,company_id), FOREIGN KEY(booking_id,trip_id,company_id,booker_user_id,mode) REFERENCES public.bookings(id,trip_id,company_id,booker_user_id,mode) ON DELETE RESTRICT,
 CHECK((mode='SELF' AND account_id IS NOT NULL AND account_id=booker_user_id) OR (mode='OTHER' AND account_id IS NULL))
);
--> statement-breakpoint
CREATE TABLE public.payments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),booking_id uuid NOT NULL UNIQUE,company_id uuid NOT NULL,trip_id uuid NOT NULL,provider_order_id text NOT NULL UNIQUE,
 amount bigint NOT NULL CHECK(amount>0),status text NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','PAID','FAILED','EXPIRED')),paid_at timestamptz,
 provider_transaction_id text UNIQUE,provider_status text,creation_state text NOT NULL DEFAULT 'NOT_STARTED' CHECK(creation_state IN ('NOT_STARTED','CREATING','READY','UNKNOWN')),
 creation_lease uuid,creation_lease_until timestamptz,snap_token text,snap_redirect_url text,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),last_error text,
 UNIQUE(id,trip_id,company_id),FOREIGN KEY(booking_id,trip_id,company_id) REFERENCES public.bookings(id,trip_id,company_id) ON DELETE RESTRICT,
 CHECK((status='PAID' AND paid_at IS NOT NULL) OR (status<>'PAID' AND paid_at IS NULL)),CHECK((creation_state='READY' AND snap_token IS NOT NULL AND snap_redirect_url IS NOT NULL) OR creation_state<>'READY')
);
--> statement-breakpoint
CREATE TABLE public.payment_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE RESTRICT,event_key text NOT NULL UNIQUE,fields jsonb NOT NULL CHECK(jsonb_typeof(fields)='object'),
 received_at timestamptz NOT NULL DEFAULT clock_timestamp(),verified_observation jsonb,verified_at timestamptz,
 status text NOT NULL DEFAULT 'RECEIVED' CHECK(status IN ('RECEIVED','PROCESSED','IGNORED','REVIEW')),attempts integer NOT NULL DEFAULT 0 CHECK(attempts BETWEEN 0 AND 8),
 lease_id uuid,lease_until timestamptz,next_attempt_at timestamptz NOT NULL DEFAULT clock_timestamp(),processed_at timestamptz,last_error text,
 CHECK((status IN ('PROCESSED','IGNORED') AND processed_at IS NOT NULL) OR (status IN ('RECEIVED','REVIEW') AND processed_at IS NULL))
);
--> statement-breakpoint
CREATE TABLE public.seat_assignments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),booking_passenger_id uuid NOT NULL UNIQUE,company_id uuid NOT NULL,trip_id uuid NOT NULL,trip_seat_id uuid NOT NULL,
 from_sequence integer NOT NULL,to_sequence integer NOT NULL,assigned_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 UNIQUE(id,trip_id,company_id),CHECK(from_sequence>0 AND to_sequence>from_sequence),
 FOREIGN KEY(booking_passenger_id,trip_id,company_id) REFERENCES public.booking_passengers(id,trip_id,company_id) ON DELETE RESTRICT,
 FOREIGN KEY(trip_seat_id,trip_id,company_id) REFERENCES public.trip_seats(id,trip_id,company_id) ON DELETE RESTRICT
);
--> statement-breakpoint
ALTER TABLE public.trip_seat_inventory ADD CONSTRAINT inventory_tenant_identity UNIQUE(id,trip_id,company_id);
--> statement-breakpoint
CREATE TABLE public.confirmed_occupancy (
 inventory_id uuid PRIMARY KEY,assignment_id uuid NOT NULL,trip_id uuid NOT NULL,company_id uuid NOT NULL,
 FOREIGN KEY(inventory_id,trip_id,company_id) REFERENCES public.trip_seat_inventory(id,trip_id,company_id) ON DELETE RESTRICT,
 FOREIGN KEY(assignment_id,trip_id,company_id) REFERENCES public.seat_assignments(id,trip_id,company_id) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE public.tickets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),booking_passenger_id uuid NOT NULL UNIQUE,assignment_id uuid NOT NULL UNIQUE,trip_id uuid NOT NULL,company_id uuid NOT NULL,
 token_hash text NOT NULL UNIQUE CHECK(length(token_hash)=64),ciphertext text NOT NULL,nonce text NOT NULL,auth_tag text NOT NULL,key_version text NOT NULL,created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(booking_passenger_id,trip_id,company_id) REFERENCES public.booking_passengers(id,trip_id,company_id) ON DELETE RESTRICT,
 FOREIGN KEY(assignment_id,trip_id,company_id) REFERENCES public.seat_assignments(id,trip_id,company_id) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE public.payment_resolutions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),booking_id uuid NOT NULL UNIQUE,company_id uuid NOT NULL,trip_id uuid NOT NULL,actor_id uuid NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,request_key uuid NOT NULL,
 action text NOT NULL CHECK(action IN ('CONFIRM','MOCK_REFUND')),amount bigint NOT NULL CHECK(amount>0),reason text NOT NULL CHECK(length(trim(reason)) BETWEEN 1 AND 500),created_at timestamptz NOT NULL DEFAULT clock_timestamp(),
 FOREIGN KEY(booking_id,trip_id,company_id) REFERENCES public.bookings(id,trip_id,company_id) ON DELETE RESTRICT
);
--> statement-breakpoint
CREATE TABLE public.booking_audit_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE RESTRICT,action text NOT NULL,actor_id uuid REFERENCES public.users(id) ON DELETE RESTRICT,metadata jsonb NOT NULL DEFAULT '{}',created_at timestamptz NOT NULL DEFAULT clock_timestamp(),UNIQUE(booking_id,action)
);
--> statement-breakpoint
CREATE INDEX booking_owner_time ON public.bookings(booker_user_id,created_at DESC);
CREATE INDEX booking_conflict_company ON public.bookings(company_id) WHERE status='PAYMENT_CONFLICT';
CREATE INDEX event_pending_replay ON public.payment_events(next_attempt_at) WHERE status='RECEIVED';
CREATE INDEX assignment_interval ON public.seat_assignments(trip_id,trip_seat_id,from_sequence,to_sequence);
--> statement-breakpoint
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_passengers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seat_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confirmed_occupancy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_resolutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_audit_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.bookings,public.booking_passengers,public.payments,public.payment_events,public.seat_assignments,public.confirmed_occupancy,public.tickets,public.payment_resolutions,public.booking_audit_events FROM anon,authenticated;
