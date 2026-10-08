export type CheckoutInput={holdId:string;requestKey:string;mode:'SELF'|'OTHER';name:string;phone:string};
export type InitiationActor={userId:string;verifiedEmail:string};
export type BookingView={id:string;bookerId:string;status:'PENDING_PAYMENT'|'EXPIRED'|'CONFIRMED'|'PAYMENT_CONFLICT'|'REFUNDED';mode:'SELF'|'OTHER';passenger:{name:string;phone:string};email:string;amount:string;orderId:string;effectiveExpiresAt:string;serverNow:string;ticketId:string|null;paymentStatus:'PENDING'|'PAID'|'FAILED'|'EXPIRED';creationState:'NOT_STARTED'|'CREATING'|'READY'|'UNKNOWN';snapshot:BookingSnapshot};
export type BookingSnapshot={tripName:string;vehicleName:string;plateNumber:string;seatCode:string;fromName:string;toName:string;departureAt:string};
