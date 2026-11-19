import AdminBackLink from '@/app/admin/components/admin-back-link';
import { paymentConflictData } from '@/app/admin/payment-data';
import PaymentConflictForm from '@/app/admin/components/payment-conflict-form';
import { bookingPresentation, formatDepartureWib, formatIdr } from '@/app/presentation';
import { paymentStatusPresentation } from '@/app/admin/presentation';

export default async function Page({
  params,
}: {
  params: Promise<{ companyId: string; bookingId: string }>;
}) {
  const { companyId, bookingId } = await params;
  const { detail } = await paymentConflictData(companyId, bookingId);
  const terminal = detail.status !== 'PAYMENT_CONFLICT';
  const booking = bookingPresentation(detail.status);
  const payment = paymentStatusPresentation(detail.paymentStatus);

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <AdminBackLink
            href={`/admin/companies/${companyId}/payment-conflicts`}
            label="Konflik pembayaran"
          />
          <h1>{detail.passengerName}</h1>
          <p>
            {detail.fromName} → {detail.toName} · {formatDepartureWib(detail.departureAt)}
          </p>
        </div>
        <div className="dash-hero-actions">
          <span className={`admin-status-pill ${terminal ? 'is-ok' : 'is-warn'}`}>
            {booking.label}
          </span>
        </div>
      </header>

      <div className="dash-detail-grid">
        <section className="dash-card admin-panel-modern">
          <div className="admin-panel-head">
            <h2>Booking dan penumpang</h2>
          </div>
          <dl className="payment-conflict-details">
            <div>
              <dt>Status booking</dt>
              <dd>
                {booking.label}
                {booking.label === 'Status perlu diperiksa' ? `: ${detail.status}` : ''}
              </dd>
            </div>
            <div>
              <dt>Kursi</dt>
              <dd>{detail.seatCode}</dd>
            </div>
            <div>
              <dt>Kontak penumpang</dt>
              <dd>
                {detail.passengerName} · {detail.passengerPhone}
              </dd>
            </div>
          </dl>
        </section>

        <section className="dash-card admin-panel-modern">
          <div className="admin-panel-head">
            <h2>Riwayat pembayaran</h2>
          </div>
          <dl className="payment-conflict-details">
            <div>
              <dt>Status pembayaran</dt>
              <dd>{payment.label}</dd>
            </div>
            <div>
              <dt>Jumlah dibayar</dt>
              <dd className="admin-tabular">{formatIdr(detail.amount)}</dd>
            </div>
            <div>
              <dt>Kode booking</dt>
              <dd>
                <code>{detail.id}</code>
              </dd>
            </div>
          </dl>
          {terminal && (
            <p role="status">
              Penyelesaian terminal sudah dicatat. Pembayaran historis tetap {payment.label}.
            </p>
          )}
        </section>
      </div>

      <section className="dash-card admin-panel-modern">
        <PaymentConflictForm
          companyId={companyId}
          bookingId={bookingId}
          confirmDisabled={detail.companyStatus !== 'ACTIVE'}
          terminal={terminal}
        />
      </section>
    </div>
  );
}
