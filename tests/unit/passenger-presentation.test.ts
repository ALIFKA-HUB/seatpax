import {it,expect} from 'vitest';
import {formatIdr,formatDepartureWib,bookingPresentation,holdPresentation} from '@/app/presentation';
it('formats money without number precision loss and uses WIB',()=>{
 expect(formatIdr('60000')).toBe('Rp 60.000');
 expect(formatIdr('9007199254740993')).toBe('Rp 9.007.199.254.740.993');
 expect(formatDepartureWib('2026-10-09T01:00:00.000Z')).toContain('08.00');
 expect(formatDepartureWib('2026-10-09T01:00:00.000Z')).toContain('WIB');
});
it('labels known statuses honestly and keeps unknown neutral',()=>{
 const states={PENDING_PAYMENT:['Menunggu pembayaran','warning'],CONFIRMED:['Dikonfirmasi','success'],PAYMENT_CONFLICT:['Pembayaran perlu ditinjau','warning'],EXPIRED:['Waktu pembayaran habis','neutral'],REFUNDED:['Refund simulasi tercatat','neutral']};
 for(const [status,[label,tone]] of Object.entries(states))expect(bookingPresentation(status)).toEqual({label,tone});
 expect(bookingPresentation('UNRECOGNIZED')).toEqual({label:'Status perlu diperiksa',tone:'neutral'});
 expect(holdPresentation('ACTIVE').label).toBe('Kursi ditahan');
 expect(holdPresentation('EXPIRED').label).toBe('Waktu hold habis');
 expect(holdPresentation('RELEASED').label).toBe('Kursi dilepas');
 expect(holdPresentation('CONVERTED').label).toBe('Dilanjutkan ke booking');
 expect(holdPresentation('UNKNOWN').tone).toBe('neutral');
});
