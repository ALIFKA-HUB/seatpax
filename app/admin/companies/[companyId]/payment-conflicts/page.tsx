import Link from 'next/link';
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

  return (
    <>
      <div className="admin-breadcrumb" aria-label="Lokasi halaman">
        <Link href={`/admin/companies/${companyId}`}>Dashboard</Link>
        <span aria-hidden="true">/</span>
        <strong>Konflik pembayaran</strong>
      </div>

      <header className="admin-header admin-page-head">
        <div>
          <p className="eyebrow">PEMBAYARAN</p>
          <h1>Konflik pembayaran</h1>
          <p>Periksa pembayaran PAID yang datang setelah kursi tidak lagi dapat dikonfirmasi.</p>
        </div>
      </header>

      <section className="admin-panel admin-panel-modern">
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
          <p className="admin-empty-copy">Tidak ada konflik pembayaran yang perlu ditinjau.</p>
        )}
      </section>

      <section className="admin-panel admin-panel-modern">
        <div className="admin-panel-head">
          <h2>
            Hasil provider perlu diperiksa <span className="admin-count">{reviews.length}</span>
          </h2>
        </div>
        <p className="admin-hint">
          Daftar ini hanya untuk pemeriksaan. Cocokkan status dengan Midtrans sebelum tindakan lain;
          status challenge atau refund tidak dapat diselesaikan sebagai tiket/refund mock dari sini.
        </p>
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
          <p className="admin-empty-copy">Tidak ada hasil provider yang menunggu pemeriksaan.</p>
        )}
      </section>
    </>
  );
}
