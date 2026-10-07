import { z } from 'zod';
import { parseWibInstant } from './time';
import type { TripDraftInput } from './types';
const time=z.string().refine(value=>{try{parseWibInstant(value);return true;}catch{return false;}},'Tanggal/jam WIB tidak valid.');
export function parseTripDraft(raw:unknown):TripDraftInput {return z.object({name:z.string().trim().min(1).max(120),routeId:z.uuid(),vehicleId:z.uuid(),serviceClassId:z.uuid(),departureWib:time,salesCloseWib:time.nullable()}).parse(raw);}
