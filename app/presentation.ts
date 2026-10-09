export type BadgeTone='neutral'|'success'|'warning'|'danger';
type StatusPresentation={label:string;tone:BadgeTone};
const unknown:StatusPresentation={label:'Status perlu diperiksa',tone:'neutral'};
export function formatIdr(amount:string):string { return `Rp ${BigInt(amount).toLocaleString('id-ID')}`; }
export function formatDepartureWib(iso:string):string {
 return new Intl.DateTimeFormat('id-ID',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit',timeZone:'Asia/Jakarta'}).format(new Date(iso))+' WIB';
}
export function bookingPresentation(status:string):StatusPresentation {
 const labels:Record<string,StatusPresentation>={PENDING_PAYMENT:{label:'Menunggu pembayaran',tone:'warning'},CONFIRMED:{label:'Dikonfirmasi',tone:'success'},PAYMENT_CONFLICT:{label:'Pembayaran perlu ditinjau',tone:'warning'},EXPIRED:{label:'Waktu pembayaran habis',tone:'neutral'},REFUNDED:{label:'Refund simulasi tercatat',tone:'neutral'}};
 return Object.hasOwn(labels,status)?labels[status]:unknown;
}
export function holdPresentation(status:string):StatusPresentation {
 const labels:Record<string,StatusPresentation>={ACTIVE:{label:'Kursi ditahan',tone:'warning'},EXPIRED:{label:'Waktu hold habis',tone:'neutral'},RELEASED:{label:'Kursi dilepas',tone:'neutral'},CONVERTED:{label:'Dilanjutkan ke booking',tone:'neutral'}};
 return Object.hasOwn(labels,status)?labels[status]:unknown;
}
