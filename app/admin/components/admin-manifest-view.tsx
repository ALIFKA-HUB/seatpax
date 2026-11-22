'use client';

import { useId, useMemo, useRef, useState } from 'react';
import {
  Armchair,
  CheckCircle,
  Info,
  MagnifyingGlass,
  Users,
} from '@phosphor-icons/react/ssr';
import type { ManifestView } from '@/modules/boarding/types';
import { filterPassengers, manifestCounters } from '@/modules/boarding/ui-state';
import { wibTime } from '@/app/crew/components/passenger-profile';
import AdminSelect from './admin-select';
import AdminEmptyState from './admin-empty-state';
import AdminPaginationBar from './admin-pagination-bar';
import { DEFAULT_ADMIN_PAGE_SIZE } from './admin-paginated-table';

const BOARDING_OPTIONS = [
  { value: 'ALL', label: 'Semua status' },
  { value: 'PENDING', label: 'Belum naik' },
  { value: 'BOARDED', label: 'Sudah naik' },
];

/**
 * Read-only Admin PO manifest view aligned with the unified Admin table, KPI strip,
 * search toolbar, and pagination patterns.
 */
export default function AdminManifestView({ view }: { view: ManifestView }) {
  const prefix = useId();
  const cardRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'BOARDED'>('ALL');
  const [page, setPage] = useState(1);

  const counters = manifestCounters(view);
  const passengers = useMemo(
    () => filterPassengers(view.passengers, query, filter),
    [view.passengers, query, filter],
  );
  const totalPages = Math.max(1, Math.ceil(passengers.length / DEFAULT_ADMIN_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * DEFAULT_ADMIN_PAGE_SIZE;
  const endIndex = Math.min(startIndex + DEFAULT_ADMIN_PAGE_SIZE, passengers.length);
  const pagedPassengers = passengers.slice(startIndex, endIndex);

  const counterIcons = [
    { tone: 'is-blue', Icon: Armchair },
    { tone: 'is-indigo', Icon: Users },
    { tone: 'is-green', Icon: CheckCircle },
  ] as const;

  return (
    <>
      <div className="admin-stat-grid" role="region" aria-label="Ringkasan manifest penumpang">
        {counters.map((counter, index) => {
          const { tone, Icon } = counterIcons[index] ?? counterIcons[0];
          return (
            <div key={counter.label} className="admin-stat-card">
              <span className={`dash-icon-badge ${tone}`} aria-hidden="true">
                <Icon size={20} weight="duotone" />
              </span>
              <div className="admin-stat-meta">
                <strong className="admin-stat-value admin-tabular">{counter.value}</strong>
                <span className="admin-stat-label">{counter.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      <section
        ref={cardRef}
        className="dash-card admin-table-card"
        aria-label="Daftar penumpang manifest"
      >
        <div className="admin-panel-head">
          <h2>
            Daftar penumpang <span className="admin-count">{view.passengerCount}</span>
          </h2>
          <span className="admin-status-pill is-neutral">Mode baca</span>
        </div>

        <div className="admin-callout-info">
          <Info size={18} weight="duotone" aria-hidden="true" />
          <span>
            Manifest ini hanya untuk dibaca. Proses boarding dan penyerahan snack dicatat oleh crew
            yang ditugaskan.
          </span>
        </div>

        <div className="admin-table-toolbar">
          <label className="hd-search-box" htmlFor={prefix + 'search'}>
            <MagnifyingGlass size={18} aria-hidden="true" />
            <span className="stop-sr-only">Cari nama penumpang atau nomor kursi</span>
            <input
              id={prefix + 'search'}
              type="search"
              value={query}
              placeholder="Ketik nama penumpang atau kursi (mis. 01)…"
              autoComplete="off"
              onChange={event => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <div className="admin-table-filter">
            <AdminSelect
              id={prefix + 'boarding'}
              ariaLabel="Status boarding"
              value={filter}
              options={BOARDING_OPTIONS}
              onChange={next => {
                setFilter(next as typeof filter);
                setPage(1);
              }}
            />
          </div>
        </div>

        {passengers.length ? (
          <>
            <div className="admin-table-wrap" role="region" aria-label="Tabel penumpang manifest" tabIndex={0}>
              <table className="admin-modern-table">
                <thead>
                  <tr>
                    <th>Kursi</th>
                    <th>Penumpang</th>
                    <th>Boarding</th>
                    <th>Snack</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedPassengers.map(passenger => (
                    <tr key={passenger.ticketId}>
                      <td>
                        <span className="manifest-seat-chip admin-tabular">{passenger.seatCode}</span>
                      </td>
                      <td>
                        <strong>{passenger.name}</strong>
                        <small>
                          {passenger.fromName} → {passenger.toName}
                        </small>
                      </td>
                      <td>
                        <span
                          className={`admin-status-pill ${passenger.boarding ? 'is-ok' : 'is-warn'}`}
                        >
                          {passenger.boarding
                            ? `Sudah naik (${wibTime(passenger.boarding.boardedAt)})`
                            : 'Belum naik'}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`admin-status-pill ${passenger.snack ? 'is-ok' : 'is-neutral'}`}
                        >
                          {passenger.snack
                            ? `Diserahkan (${wibTime(passenger.snack.claimedAt)})`
                            : 'Belum diserahkan'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPaginationBar
              mode="button"
              ariaLabel="Halaman penumpang"
              summary={`Menampilkan ${startIndex + 1}–${endIndex} dari ${passengers.length} penumpang`}
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={next => {
                setPage(next);
                cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }}
            />
          </>
        ) : (
          <>
            <AdminEmptyState
              icon={
                view.passengers.length === 0 ? (
                  <Users size={24} weight="duotone" />
                ) : (
                  <MagnifyingGlass size={24} weight="duotone" />
                )
              }
              title={
                view.passengers.length === 0
                  ? 'Belum ada penumpang terkonfirmasi'
                  : 'Tidak ada penumpang yang cocok'
              }
              description={
                view.passengers.length === 0
                  ? 'Penumpang dengan tiket terbit pada perjalanan ini akan tampil di sini.'
                  : 'Coba ubah kata kunci pencarian nama, kursi, atau status boarding.'
              }
              action={
                view.passengers.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setFilter('ALL');
                      setPage(1);
                    }}
                  >
                    Reset filter
                  </button>
                ) : undefined
              }
            />
            {view.passengers.length > 0 && (
              <div className="admin-table-footer" role="status">
                <span>Menampilkan 0 dari {view.passengers.length} penumpang</span>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
