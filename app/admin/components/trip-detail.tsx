import type { TripDetail as Detail } from '@/modules/trip/types';
import SeatGrid from './seat-grid';
import { formatDepartureWib, formatIdr } from '@/app/presentation';

export default function TripDetail({
  detail,
  preview = false,
}: {
  detail: Detail;
  preview?: boolean;
}) {
  const identity = detail.trip.identity;

  return (
    <div className="trip-detail-view">
      <div className="trip-summary">
        <div className="trip-summary-head">
          <div>
            <h2>{identity?.routeName ?? detail.trip.name}</h2>
            <p className="trip-summary-sub">
              {identity?.vehicleName ?? 'Armada belum tersedia'} · {identity?.plateNumber ?? '—'} ·{' '}
              {identity?.className ?? 'Kelas belum tersedia'}
            </p>
          </div>
          <div className="fleet-meta-strip">
            <span className="fleet-meta-chip">{detail.seats.length} kursi</span>
            <span className="fleet-meta-chip">{detail.segments.length} segmen</span>
          </div>
        </div>
        <p className="trip-summary-time">Keberangkatan: {formatDepartureWib(detail.trip.departureAt)}</p>
      </div>

      <p className="admin-hint">
        {preview
          ? 'Preview draft tersimpan'
          : 'Data perjalanan terkunci saat publikasi. Perubahan template sumber berlaku untuk perjalanan berikutnya.'}
      </p>

      <div className="admin-table-wrap" role="region" aria-label="Jadwal stop perjalanan" tabIndex={0}>
        <table className="admin-modern-table">
          <thead>
            <tr>
              <th>Stop</th>
              <th>Tiba (WIB)</th>
              <th>Berangkat (WIB)</th>
            </tr>
          </thead>
          <tbody>
            {detail.stops.map(s => (
              <tr key={s.sequence}>
                <td>
                  <strong>
                    {s.sequence}. {s.name}
                  </strong>
                  <small>
                    {s.city}
                    {s.address ? ' · ' + s.address : ''}
                  </small>
                </td>
                <td className="admin-tabular">{formatDepartureWib(s.arrivalAt)}</td>
                <td className="admin-tabular">{formatDepartureWib(s.departureAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <details className="trip-details">
        <summary>Rincian perjalanan</summary>
        <div className="trip-details-body">
          <div>
            <h3>Tarif per segmen</h3>
            <ul className="trip-fare-list">
              {detail.segments.map(s => (
                <li key={s.sequence}>
                  <span>
                    {detail.stops[s.fromSequence - 1]?.name} →{' '}
                    {detail.stops[s.toSequence - 1]?.name}
                  </span>
                  <strong className="admin-tabular">{formatIdr(s.price)}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>Denah kursi</h3>
            {detail.layout ? <SeatGrid layout={detail.layout} /> : <p>Denah belum tersedia.</p>}
          </div>
          {!preview && (
            <p className="admin-hint">
              Jumlah anchor teknis: {detail.inventoryCount}. Ini jumlah unit inventori dalam snapshot,
              bukan jumlah kursi yang tersedia untuk dijual.
            </p>
          )}
        </div>
      </details>
    </div>
  );
}
