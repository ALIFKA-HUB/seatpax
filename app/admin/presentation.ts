import type {BadgeTone} from '@/app/presentation';
type Display={label:string;tone:BadgeTone};
const unknown=(status:string):Display=>({label:`Status perlu diperiksa: ${status}`,tone:'neutral'});
export function sourceStatusPresentation(status:string):Display {
 const states:Record<string,Display>={ACTIVE:{label:'Aktif',tone:'success'},INACTIVE:{label:'Nonaktif',tone:'neutral'},ARCHIVED:{label:'Diarsipkan',tone:'neutral'},MAINTENANCE:{label:'Dalam perawatan',tone:'warning'}};
 return Object.hasOwn(states,status)?states[status]:unknown(status);
}
export type TripStatusTiming = {
  departureAt?: string | null;
  salesCloseAt?: string | null;
  arrivalAt?: string | null;
  now?: Date | string | number;
};

function parseTimestamp(value?: Date | string | number | null): number | null {
  if (value === null || value === undefined) return null;
  const ms = value instanceof Date ? value.getTime() : typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

export function tripStatusPresentation(status: string, timing?: TripStatusTiming): Display {
  if (status === 'DRAFT') return { label: 'Draft', tone: 'neutral' };
  if (status !== 'OPEN_FOR_SALE') return unknown(status);
  if (!timing) return { label: 'Penjualan dibuka', tone: 'success' };

  const nowMs = parseTimestamp(timing.now) ?? Date.now();
  const departureMs = parseTimestamp(timing.departureAt);
  const salesCloseMs = parseTimestamp(timing.salesCloseAt);
  const arrivalMs = parseTimestamp(timing.arrivalAt);

  if (arrivalMs !== null && nowMs >= arrivalMs) {
    return { label: 'Selesai', tone: 'neutral' };
  }
  if (departureMs !== null && nowMs >= departureMs) {
    return arrivalMs !== null
      ? { label: 'Berlangsung', tone: 'warning' }
      : { label: 'Selesai', tone: 'neutral' };
  }
  if (salesCloseMs !== null && nowMs >= salesCloseMs) {
    return { label: 'Penjualan ditutup', tone: 'warning' };
  }
  return { label: 'Penjualan dibuka', tone: 'success' };
}

export function isTripOpenForSaleNow(status: string, timing?: TripStatusTiming): boolean {
  if (status !== 'OPEN_FOR_SALE') return false;
  if (!timing) return true;
  const nowMs = parseTimestamp(timing.now) ?? Date.now();
  const departureMs = parseTimestamp(timing.departureAt);
  const salesCloseMs = parseTimestamp(timing.salesCloseAt);
  const cutoffMs =
    departureMs !== null && salesCloseMs !== null
      ? Math.min(departureMs, salesCloseMs)
      : (salesCloseMs ?? departureMs);
  return cutoffMs === null || nowMs < cutoffMs;
}
export function paymentStatusPresentation(status:string):Display {
 const states:Record<string,Display>={PENDING:{label:'Menunggu pembayaran',tone:'warning'},PAID:{label:'Dibayar',tone:'success'},FAILED:{label:'Gagal',tone:'danger'},EXPIRED:{label:'Kedaluwarsa',tone:'neutral'}};
 return Object.hasOwn(states,status)?states[status]:unknown(status);
}
