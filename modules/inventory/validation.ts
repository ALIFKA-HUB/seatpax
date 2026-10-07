import {z} from 'zod';
export const holdInputSchema=z.object({tripId:z.uuid(),seatId:z.uuid(),fromStopId:z.uuid(),toStopId:z.uuid(),requestKey:z.uuid()}).strict();
export const searchInputSchema=z.object({fromSourceStopId:z.uuid(),toSourceStopId:z.uuid(),dateWib:z.string()}).strict();
