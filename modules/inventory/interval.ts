import {DomainError} from '@/modules/access/transaction';
import {parseWibInstant} from '@/modules/trip/time';
import type {TripStopSnapshot} from '@/modules/trip/types';
import type {Range,HoldInput,HoldRecord} from './types';
export const overlaps=(a:Range,b:Range)=>a.from<b.to&&b.from<a.to;
export function resolveInterval(stops:TripStopSnapshot[],fromStopId:string,toStopId:string):Range{const a=stops.filter(s=>s.id===fromStopId),b=stops.filter(s=>s.id===toStopId);if(a.length!==1||b.length!==1||a[0].sequence>=b[0].sequence)throw new DomainError('validation','Pilih asal dan tujuan yang berurutan pada perjalanan ini.');return {from:a[0].sequence,to:b[0].sequence};}
export function wibDayBounds(date:string){const start=parseWibInstant(date+'T00:00');return {start,end:new Date(Date.parse(start)+86400000).toISOString()};}
export const sameHoldPayload=(h:HoldRecord,p:HoldInput)=>h.tripId===p.tripId&&h.seatId===p.seatId&&h.fromStopId===p.fromStopId&&h.toStopId===p.toStopId;
