ALTER TYPE public.membership_role ADD VALUE IF NOT EXISTS 'HELPDESK';
--> statement-breakpoint
ALTER TABLE public.memberships DROP CONSTRAINT membership_company_role;
ALTER TABLE public.memberships ADD CONSTRAINT membership_company_role CHECK ((role::text='SUPER_ADMIN' AND company_id IS NULL) OR (role::text IN ('ADMIN_PO','CREW','HELPDESK') AND company_id IS NOT NULL));
CREATE TABLE public.helpdesk_cases (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),company_id uuid NOT NULL REFERENCES public.companies(id),code text NOT NULL UNIQUE,request_key uuid NOT NULL UNIQUE,payload_hash text NOT NULL,
 name text NOT NULL,email text NOT NULL,category text NOT NULL CHECK(category IN ('PAYMENT','JOURNEY','BUG','OTHER')),title text NOT NULL,description text NOT NULL,booking_reference text,
 status text NOT NULL DEFAULT 'MENUNGGU' CHECK(status IN ('MENUNGGU','DIPROSES','PERLU_DILENGKAPI','SELESAI')),priority text CHECK(priority IN ('LOW','MEDIUM','HIGH')),revision integer NOT NULL DEFAULT 0 CHECK(revision>=0),public_request text,public_outcome text,created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(id,company_id)
);
CREATE INDEX helpdesk_cases_queue ON public.helpdesk_cases(company_id,status,created_at DESC);
CREATE TABLE public.helpdesk_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),case_id uuid NOT NULL,company_id uuid NOT NULL,revision integer NOT NULL,kind text NOT NULL,actor_id uuid REFERENCES public.users(id),note text,request_key uuid UNIQUE,payload_hash text,created_at timestamptz NOT NULL DEFAULT now(),UNIQUE(case_id,revision),FOREIGN KEY(case_id,company_id) REFERENCES public.helpdesk_cases(id,company_id));
CREATE TABLE public.helpdesk_grants (id uuid PRIMARY KEY,case_id uuid NOT NULL REFERENCES public.helpdesk_cases(id),event_id uuid NOT NULL REFERENCES public.helpdesk_events(id),digest text NOT NULL,consumed_at timestamptz,revoked_at timestamptz);
CREATE TABLE public.helpdesk_attachments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),case_id uuid NOT NULL REFERENCES public.helpdesk_cases(id),event_id uuid NOT NULL REFERENCES public.helpdesk_events(id),path text NOT NULL UNIQUE,name text NOT NULL,mime text NOT NULL,size integer NOT NULL CHECK(size>0 AND size<=5242880));
CREATE TABLE public.helpdesk_mail_jobs (id uuid PRIMARY KEY DEFAULT gen_random_uuid(),event_id uuid NOT NULL UNIQUE REFERENCES public.helpdesk_events(id),case_id uuid NOT NULL REFERENCES public.helpdesk_cases(id),payload jsonb NOT NULL,state text NOT NULL DEFAULT 'QUEUED' CHECK(state IN ('QUEUED','SENDING','ACCEPTED','FAILED','UNKNOWN')),attempts integer NOT NULL DEFAULT 0,next_attempt_at timestamptz NOT NULL DEFAULT now(),first_attempt_at timestamptz,lease_until timestamptz,provider_id text,error_code text,created_at timestamptz NOT NULL DEFAULT now());
CREATE TABLE public.helpdesk_rate_limits (key text NOT NULL,window_start bigint NOT NULL,count integer NOT NULL,PRIMARY KEY(key,window_start));
ALTER TABLE public.helpdesk_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_mail_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.helpdesk_rate_limits ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.helpdesk_cases,public.helpdesk_events,public.helpdesk_grants,public.helpdesk_attachments,public.helpdesk_mail_jobs,public.helpdesk_rate_limits FROM anon,authenticated;
