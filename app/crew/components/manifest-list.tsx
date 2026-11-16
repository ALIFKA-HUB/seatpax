'use client';
import { useState } from 'react';
import Link from 'next/link';
import { IconArrowRight, IconCheck, IconClock, IconPackage, IconSearch } from './crew-icons';
import { wibTime } from './passenger-profile';
import type { ManifestView } from '@/modules/boarding/types';
import { filterPassengers, manifestCounters } from '@/modules/boarding/ui-state';

const FILTERS: readonly { id: 'ALL' | 'PENDING' | 'BOARDED'; label: string }[] = [
  { id: 'ALL', label: 'Semua' },
  { id: 'PENDING', label: 'Belum naik' },
  { id: 'BOARDED', label: 'Sudah naik' },
];

export default function ManifestList({ view, readOnly = false }: { view: ManifestView; readOnly?: boolean }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'BOARDED'>('ALL');
  const passengers = filterPassengers(view.passengers, query, filter);

  return (
    <>
      <dl className="manifest-counters">
        {manifestCounters(view).map(counter => (
          <div key={counter.label}>
            <dt>{counter.label}</dt>
            <dd>{counter.value}</dd>
          </div>
        ))}
      </dl>

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
          <label>
            <span>Status boarding</span>
            <select
              value={filter}
              onChange={event => setFilter(event.target.value as typeof filter)}
            >
              <option value="ALL">Semua</option>
              <option value="PENDING">Belum naik</option>
              <option value="BOARDED">Sudah naik</option>
            </select>
          </label>
        </div>

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
      </div>

      <p className="manifest-count" role="status">
        {passengers.length} penumpang ditampilkan
      </p>

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
                          <span>{`Sudah naik · ${wibTime(passenger.boarding.boardedAt)}`}</span>
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
                      <span>
                        {passenger.snack
                          ? `Snack sudah diserahkan · ${wibTime(passenger.snack.claimedAt)}`
                          : 'Snack belum diserahkan'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>

              {!readOnly && (
                <Link
                  className={allDone ? 'crew-button manifest-cta' : 'crew-button crew-primary manifest-cta'}
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

      {passengers.length === 0 && (
        <p className="crew-empty">
          {view.passengers.length === 0
            ? 'Belum ada penumpang terkonfirmasi untuk perjalanan ini.'
            : 'Belum ada penumpang yang cocok dengan pencarian ini.'}
        </p>
      )}
      {readOnly && (
        <p className="crew-muted">Manifest ini hanya untuk dibaca. Boarding dicatat crew yang ditugaskan.</p>
      )}
    </>
  );
}
