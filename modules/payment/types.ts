export type ProviderOrder={orderId:string;amount:string;name:string;phone:string;email:string;initiatedAt:string;effectiveExpiresAt:string};
export type ProviderObservation={orderId:string;transactionId:string;merchantId:string;amount:string;currency:'IDR';status:string;fraudStatus:string|null;paymentType:string;verifiedAt:string};
export type SnapResult={token:string;redirectUrl:string};
export type AuthenticatedReceipt={orderId:string;eventKey:string;fields:Readonly<Record<string,string|null>>};
export interface PaymentProvider{create(order:ProviderOrder):Promise<SnapResult>;status(orderId:string):Promise<ProviderObservation|null>;authenticate(raw:unknown):AuthenticatedReceipt;}
