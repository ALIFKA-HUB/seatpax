import type {TripDetail} from '@/modules/trip/types';
export type Range={from:number;to:number};
export type HoldInput={tripId:string;seatId:string;fromStopId:string;toStopId:string;requestKey:string};
export type SearchInput={fromSourceStopId:string;toSourceStopId:string;dateWib:string};
export type HoldStatus='ACTIVE'|'RELEASED'|'EXPIRED'|'CONVERTED';
export type HoldRecord=HoldInput&{id:string;companyId:string;ownerId:string;from:number;to:number;status:HoldStatus;createdAt:string;baseExpiresAt:string;effectiveExpiresAt:string;paymentInitiatedAt:string|null;releasedAt:string|null;expiredAt:string|null};
export type HoldView={record:HoldRecord;effectiveStatus:HoldStatus;serverNow:string;detail:TripDetail;fare:string};
export type AvailabilityView={detail:TripDetail;fare:string;cutoff:string;serverNow:string;saleOpen:boolean;seats:{id:string;seatCode:string;rowIndex:number;colIndex:number;label:string|null;status:'AVAILABLE'|'HELD'|'BOOKED'}[]};
export type SearchResult={tripId:string;name:string;companyName:string;fromStopId:string;toStopId:string;originName:string;destinationName:string;departureAt:string;className:string;fare:string;availableCount:number};
