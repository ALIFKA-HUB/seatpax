export type BoardingActor={userId:string;role:'CREW'|'ADMIN_PO'};
export type BoardingRecord={id:string;ticketId:string;tripId:string;stopId:string;actorId:string;source:'QR'|'MANIFEST';boardedAt:string};
export type PassengerProfile={ticketId:string;name:string;seatCode:string;fromStopId:string;fromSequence:number;fromName:string;toName:string;tripName:string;vehicleName:string;plateNumber:string;departureAt:string;boarding:BoardingRecord|null};
export type ManifestView={tripId:string;companyId:string;tripName:string;departureAt:string;capacity:number;passengerCount:number;boardedCount:number;stops:{id:string;name:string;sequence:number}[];passengers:(Pick<PassengerProfile,'ticketId'|'name'|'seatCode'|'fromName'|'toName'>&{boarding:Pick<BoardingRecord,'boardedAt'>|null})[]};
