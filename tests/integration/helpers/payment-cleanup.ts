import type {Sql} from 'postgres';
import type {DomainTx} from '@/modules/access/transaction';
export async function cleanPaymentFixture(tx:Sql|DomainTx,companies:string[]){
 await tx`delete from public.snack_claims where company_id in ${tx(companies)}`;
 await tx`delete from public.boarding_events where company_id in ${tx(companies)}`;
 await tx`delete from public.payment_events where payment_id in (select id from public.payments where company_id in ${tx(companies)})`;
 await tx`delete from public.booking_audit_events where booking_id in (select id from public.bookings where company_id in ${tx(companies)})`;
 for(const table of ['payment_resolutions','tickets','confirmed_occupancy','seat_assignments','payments','booking_passengers','bookings'])await tx`delete from public.${tx(table)} where company_id in ${tx(companies)}`;
}
