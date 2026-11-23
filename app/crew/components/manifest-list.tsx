'use client';
import { useId, useState } from 'react';
import Link from 'next/link';
import AdminSelect from '@/app/admin/components/admin-select';
import {
  IconArrowRight,
  IconCheck,
  IconClipboard,
  IconClock,
  IconPackage,
  IconSearch,
  IconVan,
} from './crew-icons';
import { wibTime } from './passenger-profile';
import type { ManifestView } from '@/modules/boarding/types';
import { filterPassengers, manifestCounters } from '@/modules/boarding/ui-state';

const FILTERS: readonly { id: 'ALL' | 'PENDING' | 'BOARDED'; label: string }[] = [
  { id: 'ALL', label: 'Semua' },
  { id: 'PENDING', label: 'Belum naik' },
  { id: 'BOARDED', label: 'Sudah naik' },
];

const COUNTER_ICONS = [
  { tone: 'is-blue', Icon: IconVan },
  { tone: 'is-indigo', Icon: IconClipboard },
  { tone: 'is-green', Icon: IconCheck },
] as const;

export default function ManifestList({ view, readOnly = false }: { view: ManifestView; readOnly?: boolean }) {
  const statusSelectId = useId();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'BOARDED'>('ALL');
  const passengers = filterPassengers(view.passengers, query, filter);
  const counters = manifestCounters(view);

  return (
    <>
      <dl
        className="manifest-counters crew-stat-grid"
        aria-label="Ringkasan manifest penumpang"
      >
        {counters.map((counter, index) => {
          const { tone, Icon } = COUNTER_ICONS[index] ?? COUNTER_ICONS[0];
          return (
            <div key={counter.label} className="crew-stat-card">
              <span className={`crew-icon-badge ${tone}`} aria-hidden="true">
                <Icon size={20} weight="duotone" />
              </span>
              <div className="crew-stat-meta">
                <dt>{counter.label}</dt>
                <dd>{counter.value}</dd>
              </div>
            </div>
          );
        })}
      </dl>

      <section
        className="crew-panel crew-table-card"
        aria-label="Daftar penumpang manifest"
      >
        <div className="crew-panel-head">
          <h2>
            Daftar penumpang <span className="crew-count">{view.passengerCount}</span>
          </h2>
          <p className="manifest-count" role="status">
            {passengers.length} penumpang ditampilkan
          </p>
        </div>

        <div className="manifest-toolbar">
          <div className="manifest-controls">
            <label>
              <span className="manifest-label-row">
                <IconSearch size={15} />
                <span>Cari nama atau kursi</span>
              </span>
              <input
                type="search"
                value={query}
                placeholder="Ketik nama penumpang atau kursi (mis. 01)…"
                onChange={event => setQuery(event.target.value)}
                autoComplete="off"
              />
            </label>
            {readOnly ? (
              <label>
                <span>Status boarding</span>
                <select
                  value={filter}
                  onChange={event => setFilter(event.target.value as typeof filter)}
                >
                  {FILTERS.map(item => (
                    <option key={item.id} value={item.id}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="manifest-select-field">
                <label htmlFor={statusSelectId}>Status boarding</label>
                <AdminSelect
                  id={statusSelectId}
                  ariaLabel="Status boarding"
                  value={filter}
                  options={FILTERS.map(item => ({ value: item.id, label: item.label }))}
                  onChange={next => setFilter(next as typeof filter)}
                />
              </div>
            )}
          </div>

          {!readOnly && (
            <div className="crew-filter-pills" role="group" aria-label="Filter cepat boarding">
              {FILTERS.map(item => {
                const active = filter === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={active ? 'crew-pill crew-pill-active' : 'crew-pill'}
                    aria-pressed={active}
                    onClick={() => setFilter(item.id)}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {passengers.length > 0 && (
          <ul className="manifest-passengers">
            {passengers.map(passenger => {
              const allDone = Boolean(passenger.boarding && passenger.snack);
              return (
                <li key={passenger.ticketId} className="manifest-row">
                  <div className="manifest-row-main">
                    <span className="manifest-seat">
                      <span>Kursi</span>
                      <strong>{passenger.seatCode}</strong>
                    </span>

                    <div className="manifest-person">
                      <strong className="manifest-name">{passenger.name}</strong>
                      <span className="manifest-route">
                        {passenger.fromName} → {passenger.toName}
                      </span>
                      <div className="manifest-badges">
                        <span
                          className={
                            passenger.boarding
                              ? 'crew-state crew-state-success'
                              : 'crew-state crew-state-pending'
                          }
                        >
                          {passenger.boarding ? (
                            <>
                              <IconCheck size={14} />
                              <span>Sudah naik</span>
                              <small className="crew-state-time">
                                {wibTime(passenger.boarding.boardedAt)}
                              </small>
                            </>
                          ) : (
                            <>
                              <IconClock size={14} />
                              <span>Belum naik</span>
                            </>
                          )}
                        </span>
                        <span
                          className={
                            passenger.snack
                              ? 'manifest-snack crew-state crew-state-success'
                              : 'manifest-snack crew-state crew-state-neutral'
                          }
                        >
                          <IconPackage size={14} />
                          {passenger.snack ? (
                            <>
                              <span>Snack sudah diserahkan</span>
                              <small className="crew-state-time">
                                {wibTime(passenger.snack.claimedAt)}
                              </small>
                            </>
                          ) : (
                            <span>Snack belum diserahkan</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {!readOnly && (
                    <Link
                      className={
                        allDone ? 'crew-button manifest-cta' : 'crew-button crew-primary manifest-cta'
                      }
                      href={`/crew/trips/${view.tripId}/passengers/${passenger.ticketId}`}
                    >
                      <span>{allDone ? 'Lihat detail' : 'Proses check-in'}</span>
                      <IconArrowRight size={16} />
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {passengers.length === 0 && (
          <div className="crew-empty">
            <span className="crew-empty-icon is-blue" aria-hidden="true">
              {view.passengers.length === 0 ? (
                <IconClipboard size={22} weight="duotone" />
              ) : (
                <IconSearch size={22} weight="duotone" />
              )}
            </span>
            <p>
              {view.passengers.length === 0
                ? 'Belum ada penumpang terkonfirmasi untuk perjalanan ini.'
                : 'Belum ada penumpang yang cocok dengan pencarian ini.'}
            </p>
          </div>
        )}
        {readOnly && (
          <p className="crew-muted crew-manifest-readonly">
            Manifest ini hanya untuk dibaca. Boarding dicatat crew yang ditugaskan.
          </p>
        )}
      </section>
    </>
  );
}
