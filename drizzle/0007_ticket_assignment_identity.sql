ALTER TABLE public.seat_assignments ADD CONSTRAINT assignment_passenger_identity UNIQUE(id,booking_passenger_id,trip_id,company_id);
--> statement-breakpoint
ALTER TABLE public.tickets ADD CONSTRAINT ticket_assignment_passenger_identity FOREIGN KEY(assignment_id,booking_passenger_id,trip_id,company_id) REFERENCES public.seat_assignments(id,booking_passenger_id,trip_id,company_id) ON DELETE RESTRICT;
