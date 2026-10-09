import type {BadgeTone} from '@/app/presentation';
type Display={label:string;tone:BadgeTone};
const unknown=(status:string):Display=>({label:`Status perlu diperiksa: ${status}`,tone:'neutral'});
export function sourceStatusPresentation(status:string):Display {
 const states:Record<string,Display>={ACTIVE:{label:'Aktif',tone:'success'},INACTIVE:{label:'Nonaktif',tone:'neutral'},ARCHIVED:{label:'Diarsipkan',tone:'neutral'},MAINTENANCE:{label:'Dalam perawatan',tone:'warning'}};
 return Object.hasOwn(states,status)?states[status]:unknown(status);
}
export function tripStatusPresentation(status:string):Display {
 const states:Record<string,Display>={DRAFT:{label:'Draft',tone:'neutral'},OPEN_FOR_SALE:{label:'Penjualan dibuka',tone:'success'}};
 return Object.hasOwn(states,status)?states[status]:unknown(status);
}
export function paymentStatusPresentation(status:string):Display {
 const states:Record<string,Display>={PENDING:{label:'Menunggu pembayaran',tone:'warning'},PAID:{label:'Dibayar',tone:'success'},FAILED:{label:'Gagal',tone:'danger'},EXPIRED:{label:'Kedaluwarsa',tone:'neutral'}};
 return Object.hasOwn(states,status)?states[status]:unknown(status);
}
