export type CheckoutIntent={fingerprint:string;requestKey:string};
export function passengerForMode(mode:'SELF'|'OTHER',profile:{name:string;phone:string}){return mode==='SELF'?{...profile}:{name:'',phone:''};}
export function checkoutIntent(previous:CheckoutIntent|null,fingerprint:string):CheckoutIntent{
 return previous?.fingerprint===fingerprint?previous:{fingerprint,requestKey:crypto.randomUUID()};
}
export function paymentCallbackState(status:string){return {refresh:true as const,status};}
export function popupClosedState(status:string){return status;}
export function pollingTerminal(status:string){return status!=='PENDING_PAYMENT';}
