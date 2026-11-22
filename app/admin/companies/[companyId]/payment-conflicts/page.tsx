import Link from 'next/link';
import {
  CheckCircle,
  ClipboardText,
  CreditCard,
  Info,
  ShieldCheck,
  WarningCircle,
} from '@phosphor-icons/react/ssr';
import { paymentConflictData } from '@/app/admin/payment-data';

const date = (s: string) =>
  new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(s)) + ' WIB';

export default async function Page({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { conflicts, reviews } = await paymentConflictData(companyId);
  const totalQueue = conflicts.length + reviews.length;

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <h1>Konflik pembayaran</h1>
          <p>Periksa pembayaran PAID yang datang setelah kursi tidak lagi dapat dikonfirmasi.</p>
        </div>
        <div className="dash-hero-actions">
          <span className={`admin-status-pill ${totalQueue === 0 ? 'is-ok' : 'is-warn'}`}>
            {totalQueue === 0 ? 'Antrean bersih' : `${totalQueue} perlu pemeriksaan`}
          </span>
        </div>
      </header>

      <div className="admin-stat-grid" role="region" aria-label="Ringkasan pemeriksaan pembayaran">
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-amber" aria-hidden="true">
            <WarningCircle size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{conflicts.length}</strong>
            <span className="admin-stat-label">Konflik perlu tinjau</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-blue" aria-hidden="true">
            <CreditCard size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{reviews.length}</strong>
            <span className="admin-stat-label">Hasil provider diperiksa</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-slate" aria-hidden="true">
            <ClipboardText size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{totalQueue}</strong>
            <span className="admin-stat-label">Total antrean pemeriksaan</span>
          </div>
        </div>
      </div>

      <section className="dash-card admin-panel-modern">
        <div className="admin-panel-head">
          <h2>
            Perlu ditinjau <span className="admin-count">{conflicts.length}</span>
          </h2>
        </div>
        {conflicts.length ? (
          <div
            className="admin-table-wrap"
            role="region"
            aria-label="Daftar pemeriksaan pembayaran"
            tabIndex={0}
          >
            <table className="admin-modern-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Penumpang</th>
                  <th>Perjalanan</th>
                  <th>Jumlah</th>
                  <th>Dibuat</th>
                  <th>Kelola</th>
                </tr>
              </thead>
              <tbody>
                {conflicts.map(b => (
                  <tr key={b.id}>
                    <td>
                      <code>{b.id.slice(0, 8).toUpperCase()}</code>
                    </td>
                    <td>
                      <strong>{b.passengerName}</strong>
                    </td>
                    <td>
                      {b.fromName} → {b.toName}
                      <small>{date(b.departureAt)}</small>
                    </td>
                    <td className="admin-tabular">
                      Rp {BigInt(b.amount).toLocaleString('id-ID')}
                    </td>
                    <td className="admin-tabular">{date(b.createdAt)}</td>
                    <td>
                      <Link
                        className="admin-row-link"
                        href={`/admin/companies/${companyId}/payment-conflicts/${b.id}`}
                      >
                        Tinjau →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            <span className="admin-empty-icon is-ok" aria-hidden="true">
              <CheckCircle size={24} weight="duotone" />
            </span>
            <h3>Semua pembayaran aman</h3>
            <p>Tidak ada konflik pembayaran yang perlu ditinjau.</p>
          </div>
        )}
      </section>

      <section className="dash-card admin-panel-modern">
        <div className="admin-panel-head">
          <h2>
            Hasil provider perlu diperiksa <span className="admin-count">{reviews.length}</span>
          </h2>
        </div>
        <div className="admin-callout-info">
          <Info size={18} weight="duotone" aria-hidden="true" />
          <span>
            Daftar ini hanya untuk pemeriksaan. Cocokkan status dengan Midtrans sebelum tindakan
            lain; status challenge atau refund tidak dapat diselesaikan sebagai tiket/refund mock
            dari sini.
          </span>
        </div>
        {reviews.length ? (
          <div
            className="admin-table-wrap"
            role="region"
            aria-label="Daftar pemeriksaan pembayaran"
            tabIndex={0}
          >
            <table className="admin-modern-table">
              <thead>
                <tr>
                  <th>Booking</th>
                  <th>Order Midtrans</th>
                  <th>Status pemeriksaan</th>
                  <th>Diterima</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map(item => (
                  <tr key={item.bookingId + item.receivedAt}>
                    <td>
                      <code>{item.bookingId.slice(0, 8).toUpperCase()}</code>
                    </td>
                    <td>
                      <code>{item.orderId}</code>
                    </td>
                    <td>{item.reason}</td>
                    <td className="admin-tabular">{date(item.receivedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="admin-empty-state">
            <span className="admin-empty-icon is-blue" aria-hidden="true">
              <ShieldCheck size={24} weight="duotone" />
            </span>
            <h3>Tidak ada antrean provider</h3>
            <p>Tidak ada hasil provider yang menunggu pemeriksaan.</p>
          </div>
        )}
      </section>
    </div>
  );
}
