import Link from 'next/link';
import {paymentConflictData} from '@/app/admin/payment-data';
import PaymentConflictForm from '@/app/admin/components/payment-conflict-form';
import {bookingPresentation,formatIdr,formatDepartureWib} from '@/app/presentation';
import {paymentStatusPresentation} from '@/app/admin/presentation';
export default async function Page({params}:{params:Promise<{companyId:string;bookingId:string}>}) {
 const {companyId,bookingId}=await params;const {detail}=await paymentConflictData(companyId,bookingId);const terminal=detail.status!=='PAYMENT_CONFLICT';const booking=bookingPresentation(detail.status),payment=paymentStatusPresentation(detail.paymentStatus);
 return <><header className="admin-header"><Link href={`/admin/companies/${companyId}/payment-conflicts`}>← Konflik pembayaran</Link><p className="eyebrow">Tinjau booking</p><h1>{detail.passengerName}</h1><p>{detail.fromName} → {detail.toName} · {formatDepartureWib(detail.departureAt)}</p></header>
 <section className="admin-panel"><h2>Booking dan penumpang</h2><dl className="payment-conflict-details"><div><dt>Status booking</dt><dd>{booking.label}{booking.label==='Status perlu diperiksa'?`: ${detail.status}`:''}</dd></div><div><dt>Kursi</dt><dd>{detail.seatCode}</dd></div><div><dt>Kontak penumpang</dt><dd>{detail.passengerName} · {detail.passengerPhone}</dd></div></dl></section>
 <section className="admin-panel"><h2>Riwayat pembayaran</h2><dl className="payment-conflict-details"><div><dt>Status pembayaran</dt><dd>{payment.label}</dd></div><div><dt>Jumlah dibayar</dt><dd>{formatIdr(detail.amount)}</dd></div><div><dt>Kode booking</dt><dd><code>{detail.id}</code></dd></div></dl>{terminal&&<p role="status">Penyelesaian terminal sudah dicatat. Pembayaran historis tetap {payment.label}.</p>}</section>
 <PaymentConflictForm companyId={companyId} bookingId={bookingId} confirmDisabled={detail.companyStatus!=='ACTIVE'} terminal={terminal}/></>;
}