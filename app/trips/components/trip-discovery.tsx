'use client';

import Link from 'next/link';
import {useRef, useState} from 'react';
import {MapTrifold, SlidersHorizontal, X} from '@phosphor-icons/react';
import type {LocationPoint, SearchResult} from '@/modules/inventory/types';
import {filterAndSortTrips} from '@/modules/inventory/discovery-presentation';
import TripCard from '@/app/components/trip-card';

type DateOption = {dateWib: string; label: string};

const FARE_PRESETS = [
  {value: '80000', label: '≤ Rp 80 rb'},
  {value: '120000', label: '≤ Rp 120 rb'},
  {value: '150000', label: '≤ Rp 150 rb'},
] as const;

const longDateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
});

function splitDateLabel(label: string): {day: string; date: string} {
  const parts = label.split(', ');
  if (parts.length >= 2) return {day: parts[0], date: parts.slice(1).join(', ')};
  return {day: 'Tanggal', date: label};
}

export default function TripDiscovery({
  trips,
  fallbackTrips = [],
  locations = [],
  quickDates = [],
  candidateLimitReached,
  dateWib,
  hasExplicitDate,
  from,
  to,
}: {
  trips: SearchResult[];
  fallbackTrips?: SearchResult[];
  locations?: LocationPoint[];
  quickDates?: DateOption[];
  candidateLimitReached: boolean;
  dateWib: string;
  hasExplicitDate: boolean;
  from?: string;
  to?: string;
}) {
  const [classes, setClasses] = useState<string[]>([]);
  const [maxFare, setMaxFare] = useState('');
  const [draftClasses, setDraftClasses] = useState<string[]>([]);
  const [draftFare, setDraftFare] = useState('');
  const [sort, setSort] = useState<'departure' | 'price'>('departure');
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const activeList = trips.length > 0 ? trips : fallbackTrips;
  const isFallback = trips.length === 0 && fallbackTrips.length > 0;
  const options = Array.from(new Set(activeList.map(trip => trip.className))).sort();
  const visible = filterAndSortTrips(trips, {classNames: classes, maxFare, sort});
  const visibleFallback = filterAndSortTrips(fallbackTrips, {classNames: classes, maxFare, sort});
  const displayedTrips = isFallback ? visibleFallback : visible;
  const count = classes.length + (maxFare ? 1 : 0);

  const clear = () => {
    setClasses([]);
    setMaxFare('');
  };

  const open = () => {
    setDraftClasses([...classes]);
    setDraftFare(maxFare);
    dialog.current?.showModal();
  };

  function hrefForDate(nextDate?: string) {
    const params = new URLSearchParams();
    if (from) params.set('from', from);
    if (to) params.set('to', to);
    if (nextDate) params.set('date', nextDate);
    const qs = params.toString();
    return qs ? `/trips?${qs}` : '/trips';
  }

  const formattedTargetDate = hasExplicitDate
    ? longDateFormatter.format(new Date(`${dateWib}T12:00:00+07:00`))
    : '';

  return (
    <section className="tp-results" aria-labelledby="results-title">
      {(quickDates.length > 0 || hasExplicitDate) && (
        <nav className="tp-date-bar" aria-label="Filter tanggal cepat">
          <Link
            className={`tp-date-chip${!hasExplicitDate ? ' is-active' : ''}`}
            href={hrefForDate()}
            aria-current={!hasExplicitDate ? 'true' : undefined}
          >
            <span className="tp-date-day">Semua</span>
            <span className="tp-date-val">Jadwal mendatang</span>
          </Link>
          {quickDates.map(option => {
            const parts = splitDateLabel(option.label);
            return (
              <Link
                key={option.dateWib}
                className={`tp-date-chip${hasExplicitDate && dateWib === option.dateWib ? ' is-active' : ''}`}
                href={hrefForDate(option.dateWib)}
                aria-current={hasExplicitDate && dateWib === option.dateWib ? 'true' : undefined}
              >
                <span className="tp-date-day">{parts.day}</span>
                <span className="tp-date-val">{parts.date}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {isFallback && (
        <div className="tp-fallback-banner" role="status">
          <div>
            <strong>Belum ada jadwal pada {formattedTargetDate}</strong>
            <p>Menampilkan jadwal shuttle terdekat yang tersedia untuk rute dan tanggal mendatang.</p>
          </div>
          <Link className="sp-secondary" href={hrefForDate()}>
            Tampilkan semua jadwal
          </Link>
        </div>
      )}

      <div className="tp-results-bar">
        <div className="tp-results-heading">
          <h2 id="results-title">
            {activeList.length === 0
              ? 'Daftar jadwal'
              : isFallback
                ? 'Jadwal shuttle terdekat yang tersedia'
                : hasExplicitDate
                  ? `Keberangkatan ${formattedTargetDate}`
                  : 'Jadwal tersedia'}
          </h2>
          <p aria-live="polite">
            {activeList.length === 0
              ? 'Belum ada keberangkatan terbuka pada pencarian ini'
              : isFallback
                ? `${visibleFallback.length} jadwal mendatang ditemukan`
                : `${visible.length} perjalanan tersedia`}
          </p>
        </div>

        {activeList.length > 0 && (
          <div className="tp-toolbar-controls">
            <div className="tp-segmented" role="group" aria-label="Urutkan perjalanan">
              <button
                type="button"
                className={sort === 'departure' ? 'is-active' : undefined}
                aria-pressed={sort === 'departure'}
                onClick={() => setSort('departure')}
              >
                Berangkat awal
              </button>
              <button
                type="button"
                className={sort === 'price' ? 'is-active' : undefined}
                aria-pressed={sort === 'price'}
                onClick={() => setSort('price')}
              >
                Harga terendah
              </button>
            </div>
            <button
              ref={trigger}
              className={`tp-filter-btn${count > 0 ? ' has-active' : ''}`}
              type="button"
              onClick={open}
              aria-haspopup="dialog"
            >
              <SlidersHorizontal size={17} aria-hidden="true" />
              Filter{count > 0 && <span className="sp-filter-count">{count}</span>}
            </button>
          </div>
        )}
      </div>

      {count > 0 && (
        <div className="sp-applied-filters">
          {classes.map(name => (
            <span className="tp-applied-pill" key={name}>
              {name}
            </span>
          ))}
          {maxFare && (
            <span className="tp-applied-pill">Maks. Rp {BigInt(maxFare).toLocaleString('id-ID')}</span>
          )}
          <button type="button" onClick={clear}>
            Hapus filter
          </button>
        </div>
      )}

      {candidateLimitReached && (
        <p className="sp-limit-note">
          Daftar dibatasi 50 jadwal terdekat. Gunakan pilihan asal, tujuan, atau tanggal untuk mempersempit hasil.
        </p>
      )}

      {activeList.length > 0 ? (
        displayedTrips.length > 0 ? (
          <div className="tp-list">
            {displayedTrips.map(trip => (
              <TripCard key={`${trip.tripId}:${trip.fromStopId}:${trip.toStopId}`} trip={trip} />
            ))}
          </div>
        ) : (
          <div className="tp-empty-state">
            <div className="tp-empty-icon" aria-hidden="true">
              <MapTrifold size={26} />
            </div>
            <h3>Belum ada jadwal yang cocok dengan filter Anda</h3>
            <p>Coba hapus filter kelas layanan atau batas tarif maksimal.</p>
            <button type="button" className="sp-secondary" onClick={clear}>
              Hapus filter
            </button>
          </div>
        )
      ) : (
        <div className="tp-empty-state">
          <div className="tp-empty-icon" aria-hidden="true">
            <MapTrifold size={26} />
          </div>
          <h3>Belum ada jadwal perjalanan terbuka</h3>
          <p>
            Saat ini belum ada keberangkatan shuttle yang dibuka untuk penjualan online. Coba ubah rute atau periksa
            kembali nanti.
          </p>
          {locations.length > 0 && (
            <div className="tp-empty-stops" aria-label="Titik shuttle yang dilayani">
              {locations.map(stop => (
                <span className="tp-stop-chip" key={stop.id}>
                  {stop.name} ({stop.city})
                </span>
              ))}
            </div>
          )}
          <div className="tp-empty-actions">
            {(from || to || hasExplicitDate) && (
              <Link className="sp-secondary" href="/trips">
                Tampilkan semua jadwal
              </Link>
            )}
            <Link className="sp-secondary" href="/pengaduan/buat">
              Butuh bantuan?
            </Link>
          </div>
        </div>
      )}

      <dialog
        ref={dialog}
        className="sp-filter-dialog tp-filter-dialog"
        aria-labelledby="filter-dialog-title"
        onClose={() => trigger.current?.focus()}
      >
        <div className="sp-filter-heading">
          <h2 id="filter-dialog-title">Filter perjalanan</h2>
          <button
            type="button"
            className="sp-icon-button"
            aria-label="Tutup filter"
            onClick={() => dialog.current?.close()}
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>

        <form
          method="dialog"
          onSubmit={() => {
            setClasses(draftClasses);
            setMaxFare(draftFare.replace(/\D/g, ''));
          }}
        >
          {options.length > 0 && (
            <fieldset>
              <legend>Kelas layanan</legend>
              <div className="tp-chip-group">
                {options.map(name => {
                  const selected = draftClasses.includes(name);
                  return (
                    <label
                      className={`tp-toggle-chip${selected ? ' is-selected' : ''}`}
                      key={name}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={event =>
                          setDraftClasses(current =>
                            event.target.checked
                              ? [...current, name]
                              : current.filter(item => item !== name),
                          )
                        }
                      />
                      {name}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          )}

          <fieldset>
            <legend>Tarif maksimal (Rp)</legend>
            <div className="tp-chip-group" style={{marginBottom: 12}}>
              {FARE_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  className={`tp-toggle-chip${draftFare === preset.value ? ' is-selected' : ''}`}
                  onClick={() => setDraftFare(current => (current === preset.value ? '' : preset.value))}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <label className="sp-fare-filter">
              <span>Atau masukkan nominal sendiri (misal 100000)</span>
              <input
                inputMode="numeric"
                value={draftFare}
                onChange={event => setDraftFare(event.target.value.replace(/\D/g, ''))}
                placeholder="Semua tarif"
              />
            </label>
          </fieldset>

          <div className="sp-filter-actions">
            <button
              type="button"
              className="sp-secondary"
              onClick={() => {
                setDraftClasses([]);
                setDraftFare('');
                clear();
                dialog.current?.close();
              }}
            >
              Reset
            </button>
            <button type="submit" className="tp-cta-accent">
              Terapkan filter
            </button>
          </div>
        </form>
      </dialog>
    </section>
  );
}
