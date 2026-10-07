import type { Layout } from '@/modules/fleet/types';
export type TripStatus = 'DRAFT' | 'OPEN_FOR_SALE';
export type TripDraftInput = { name:string;routeId:string;vehicleId:string;serviceClassId:string;departureWib:string;salesCloseWib:string|null };
export type TripCommandResult = {tripId:string;revision:number;status:TripStatus};
export type SourceStop = {sourceId:string;stopId:string;name:string;city:string;address:string|null;sequence:number;arrivalOffsetMin:number|null;departureOffsetMin:number|null;status:string};
export type PublicationSource = {
 route:{id:string;name:string;code:string|null;revision:number;status:string};
 vehicle:{id:string;name:string;plateNumber:string;revision:number;status:string};
 serviceClass:{id:string;name:string;code:string;status:string};template:{id:string;version:number;status:string};
 stops:SourceStop[];fares:{fromSourceId:string;toSourceId:string;price:string;currency:string}[];layout:Layout;
};
export type TripStopSnapshot = {id?:string;sourceId:string;stopId:string;name:string;city:string;address:string|null;sequence:number;arrivalAt:string;departureAt:string};
export type TripSegmentSnapshot = {id?:string;sequence:number;fromSequence:number;toSequence:number;price:string;currency:'IDR'};
export type TripSeatSnapshot = {id?:string;seatCode:string;rowIndex:number;colIndex:number;label:string|null};
export type PublicationProjection = {stops:TripStopSnapshot[];segments:TripSegmentSnapshot[];seats:TripSeatSnapshot[];layout:Layout;identity:{routeName:string;routeCode:string|null;routeRevision:number;vehicleName:string;plateNumber:string;vehicleRevision:number;className:string;classCode:string;templateId:string;templateVersion:number}};
export type TripRecord = {id:string;companyId:string;name:string;routeId:string;vehicleId:string;serviceClassId:string;departureAt:string;salesCloseAt:string|null;revision:number;status:TripStatus;publishedAt:string|null;identity:PublicationProjection['identity']|null};
export type TripDetail = {trip:TripRecord;stops:TripStopSnapshot[];segments:TripSegmentSnapshot[];seats:TripSeatSnapshot[];layout:Layout|null;inventoryCount:number};
