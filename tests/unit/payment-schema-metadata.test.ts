import {it,expect} from 'vitest';
import {getTableConfig} from 'drizzle-orm/pg-core';
import {bookings,bookingPassengers,payments,paymentEvents,seatAssignments,confirmedOccupancy,tickets,paymentResolutions,bookingAuditEvents} from '@/lib/db/schema';
it('retains payment safeguards in declarative migration metadata',()=>{
 for(const [table,fks,checks] of [[bookings,2,4],[bookingPassengers,2,3],[payments,1,4],[paymentEvents,1,3],[seatAssignments,2,1],[confirmedOccupancy,2,0],[tickets,2,1],[paymentResolutions,2,3],[bookingAuditEvents,2,0]] as const){const config=getTableConfig(table);expect(config.foreignKeys.length,config.name).toBeGreaterThanOrEqual(fks);expect(config.checks.length,config.name).toBeGreaterThanOrEqual(checks);}
});
