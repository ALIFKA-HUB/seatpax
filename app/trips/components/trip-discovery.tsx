'use client';

import Link from 'next/link';
import {Fragment, useRef, useState} from 'react';
import {
  ArrowRight,
  CalendarBlank,
  ChatCircleDots,
  MapPin,
  MapTrifold,
  Path,
  ShieldCheck,
  SlidersHorizontal,
  X,
} from '@phosphor-icons/react';
import type {LocationPoint, NetworkRouteCorridor, SearchResult} from '@/modules/inventory/types';
import {filterAndSortTrips} from '@/modules/inventory/discovery-presentation';
import {formatIdr} from '@/app/presentation';
import TripCard from '@/app/components/trip-card';

type DateOption = {dateWib: string; label: string};

export type WeekCalendarDay = {
  dateWib: string;
  dayShort: string;
  dateNum: number;
  isToday: boolean;
  isSelected: boolean;
  tripCount: number;
};

const FARE_PRESETS = [
  {value: '80000', label: '≤ Rp 80 rb'},
  {value: '120000', label: '≤ Rp 120 rb'},
  {value: '150000', label: '≤ Rp 150 rb'},
] as const;

function splitDateLabel(label: string): {day: string; date: string} {
  const parts = label.split(', ');
  if (parts.length >= 2) return {day: parts[0], date: parts.slice(1).join(', ')};
  return {day: 'Tanggal', date: label};
}

function formatAgendaTimeWib(iso: string): string {
  return (
    new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    }).format(new Date(iso)) + ' WIB'
  );
}

export default function TripDiscovery({
  trips,
  fallbackTrips = [],
  locations = [],
  corridors = [],
  serviceClasses = [],
  weekCalendar = [],
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
  corridors?: NetworkRouteCorridor[];
  serviceClasses?: {name: string; code: string}[];
  weekCalendar?: WeekCalendarDay[];
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
  const displayedCount = displayedTrips.length;
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
    ? new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      }).format(new Date(`${dateWib}T12:00:00+07:00`))
    : '';

  const agendaTrips = activeList.slice(0, 4);
  const hasDirectoryContent = corridors.length > 0 || locations.length > 0 || serviceClasses.length > 0;

  return (
    <div className="tp-dash-bento">
      <section className="tp-primary-col" aria-labelledby="results-title">
        <div className="tp-card-panel">
          <div className="tp-panel-head">
            <div>
              <h2 id="results-title">
                {activeList.length === 0
                  ? 'Jadwal shuttle'
                  : isFallback
                    ? 'Jadwal shuttle terdekat yang tersedia'
                    : hasExplicitDate
                      ? `Jadwal berangkat ${formattedTargetDate}`
                      : 'Jadwal shuttle mendatang'}
              </h2>
              <p aria-live="polite">
                {activeList.length === 0
                  ? 'Belum ada keberangkatan terbuka pada pencarian ini'
                  : isFallback
                    ? `${visibleFallback.length} jadwal mendatang ditemukan`
                    : `${visible.length} perjalanan tersedia${hasExplicitDate ? ` pada ${formattedTargetDate}` : ' untuk keberangkatan terdekat'}`}
              </p>
            </div>
            <span className="tp-count-pill">{displayedCount} jadwal</span>
          </div>

          <div className="tp-primary-panel-body">
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
                  <p>Berikut jadwal shuttle terdekat yang masih tersedia untuk rute dan tanggal mendatang.</p>
                </div>
                <Link className="sp-secondary" href={hrefForDate()}>
                  Tampilkan semua jadwal
                </Link>
              </div>
            )}

            {activeList.length > 0 && (
              <div className="tp-toolbar">
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
                Daftar dibatasi 50 jadwal terdekat. Gunakan pencarian asal dan tujuan atau tanggal untuk mempersempit
                pilihan.
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
                <div className="tp-empty-card">
                  <div className="tp-empty-icon" aria-hidden="true">
                    <MapTrifold size={28} />
                  </div>
                  <h3>Belum ada yang cocok dengan filter Anda</h3>
                  <p>Coba hapus filter kelas layanan atau batas harga.</p>
                  <div className="sp-actions" style={{justifyContent: 'center'}}>
                    <button type="button" className="sp-secondary" onClick={clear}>
                      Hapus filter
                    </button>
                  </div>
                </div>
              )
            ) : (
              <div className="tp-empty-card">
                <div className="tp-empty-icon" aria-hidden="true">
                  <MapTrifold size={28} />
                </div>
                <h3>Belum ada jadwal perjalanan terbuka</h3>
                <p>
                  Saat ini belum ada keberangkatan shuttle yang dibuka untuk penjualan online. Periksa kembali nanti
                  atau ubah pencarian rute.
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
              </div>
            )}
          </div>
        </div>

        {hasDirectoryContent && (
          <section className="tp-card-panel" id="direktori-titik" aria-labelledby="directory-title">
            <div className="tp-panel-head">
              <div>
                <h2 id="directory-title">
                  <Path size={18} aria-hidden="true" />
                  Direktori rute dan titik naik resmi
                </h2>
                <p>
                  Daftar koridor shuttle aktif, urutan titik naik dan turun, serta lokasi pool resmi yang dilayani.
                </p>
              </div>
              {corridors.length > 0 && <span className="tp-count-pill">{corridors.length} rute aktif</span>}
            </div>

            <div className="tp-directory-stack">
              {serviceClasses.length > 0 && (
                <div className="tp-class-pills" aria-label="Kelas layanan aktif">
                  {serviceClasses.map(serviceClass => (
                    <span className="tp-class-pill" key={`${serviceClass.code}-${serviceClass.name}`}>
                      <span>{serviceClass.name}</span>
                      <span className="tp-class-code">{serviceClass.code}</span>
                    </span>
                  ))}
                </div>
              )}

              {corridors.length > 0 && (
                <div className="tp-directory-group">
                  <h3 className="tp-directory-subhead">Koridor rute aktif</h3>
                  <div className="tp-corridor-grid">
                    {corridors.map(route => {
                      const canSearchRoute = route.stops.length >= 2;
                      const firstStop = route.stops[0];
                      const lastStop = route.stops[route.stops.length - 1];
                      return (
                        <article className="tp-corridor-card" key={route.id}>
                          <div className="tp-corridor-head">
                            <div className="tp-corridor-title">
                              <strong>{route.name}</strong>
                              <span className="tp-corridor-company">{route.companyName}</span>
                            </div>
                            {route.code && <span className="tp-corridor-code">{route.code}</span>}
                          </div>

                          {route.stops.length > 0 && (
                            <div className="tp-corridor-stops" aria-label={`Urutan titik ${route.name}`}>
                              {route.stops.map((stop, index) => (
                                <Fragment key={`${route.id}-${stop.stopId}-${index}`}>
                                  <span className="tp-corridor-stop-chip">{stop.name}</span>
                                  {index < route.stops.length - 1 && (
                                    <span className="tp-corridor-stop-arrow" aria-hidden="true">
                                      <ArrowRight size={13} />
                                    </span>
                                  )}
                                </Fragment>
                              ))}
                            </div>
                          )}

                          <div className="tp-corridor-foot">
                            <div className="tp-corridor-meta">
                              {route.minSegmentFare && (
                                <span className="tp-corridor-fare">Mulai {formatIdr(route.minSegmentFare)}</span>
                              )}
                              <span>{route.openTripCount} jadwal aktif</span>
                            </div>
                            {canSearchRoute && (
                              <Link
                                className="tp-dash-link"
                                href={`/trips?from=${firstStop.stopId}&to=${lastStop.stopId}`}
                              >
                                Cari rute ini <ArrowRight size={14} aria-hidden="true" />
                              </Link>
                            )}
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              )}

              {locations.length > 0 && (
                <div className="tp-directory-group">
                  <h3 className="tp-directory-subhead">Titik naik dan turun</h3>
                  <div className="tp-stop-directory">
                    {locations.map(location => (
                      <article className="tp-stop-dir-card" key={location.id}>
                        <div className="tp-stop-dir-head">
                          <strong>{location.name}</strong>
                          <span className="tp-stop-dir-city">{location.city}</span>
                        </div>
                        <p className="tp-stop-dir-address">
                          <MapPin size={14} aria-hidden="true" />
                          <span>{location.address ?? `Area ${location.city}`}</span>
                        </p>
                      </article>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </section>

      <aside className="tp-side-col" aria-label="Kalender dan panduan perjalanan">
        <section className="tp-card-panel">
          <div className="tp-panel-head">
            <div>
              <h2>Kalender keberangkatan</h2>
              <p>Pilih tanggal untuk menyaring jadwal WIB</p>
            </div>
            <span className="tp-count-pill">{hasExplicitDate ? formattedTargetDate : '7 hari WIB'}</span>
          </div>

          {weekCalendar.length > 0 && (
            <nav className="tp-week-strip" aria-label="Kalender 7 hari WIB">
              {weekCalendar.map(day => (
                <Link
                  key={day.dateWib}
                  href={hrefForDate(day.dateWib)}
                  className={`tp-week-day${day.isToday ? ' is-today' : ''}${day.isSelected ? ' is-selected' : ''}`}
                  aria-current={day.isSelected ? 'date' : undefined}
                  aria-label={`${day.dayShort} ${day.dateNum}, ${day.tripCount} jadwal tersedia`}
                >
                  <span className="tp-week-name">{day.dayShort}</span>
                  <span className="tp-week-num">{day.dateNum}</span>
                  <span
                    className={`tp-week-dot${day.tripCount > 0 ? ' is-visible' : ''}`}
                    aria-hidden="true"
                  />
                </Link>
              ))}
            </nav>
          )}

          <h3 className="tp-directory-subhead" style={{marginBottom: '10px'}}>
            Keberangkatan terdekat
          </h3>

          {agendaTrips.length > 0 ? (
            <ul className="tp-agenda-list">
              {agendaTrips.map(trip => (
                <li key={`${trip.tripId}:${trip.fromStopId}:${trip.toStopId}`}>
                  <Link
                    className="tp-agenda-item"
                    href={`/trips/${trip.tripId}?from=${trip.fromStopId}&to=${trip.toStopId}`}
                  >
                    <div className="tp-agenda-top">
                      <strong>{trip.name}</strong>
                      <span className="tp-status-tag is-open">{trip.availableCount} kursi</span>
                    </div>
                    <p className="tp-agenda-route">
                      {trip.originName} ke {trip.destinationName}
                    </p>
                    <div className="tp-agenda-foot">
                      <span>{formatAgendaTimeWib(trip.departureAt)}</span>
                      <span>{formatIdr(trip.fare)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="tp-agenda-empty">
              <CalendarBlank size={28} weight="duotone" aria-hidden="true" />
              <strong>Belum ada keberangkatan terdekat</strong>
              <p>Periksa direktori rute aktif atau ubah pencarian tanggal untuk melihat jadwal lain.</p>
              <a href="#direktori-titik" className="tp-outline-cta">
                Lihat rute <ArrowRight size={14} aria-hidden="true" />
              </a>
            </div>
          )}
        </section>

        <div className="tp-tint-card is-blue">
          <div className="tp-tint-head">
            <span className="tp-tint-icon" aria-hidden="true">
              <ShieldCheck size={18} weight="duotone" />
            </span>
            <span className="tp-tint-count">10 menit</span>
          </div>
          <strong>Alur kunci kursi &amp; e-tiket</strong>
          <p>
            Kursi yang Anda tahan terkunci selama 10 menit dan mendapat tambahan grace period 1 menit saat pembayaran
            dimulai. QR e-tiket langsung aktif begitu transaksi dikonfirmasi.
          </p>
        </div>

        <div className="tp-tint-card is-amber">
          <div className="tp-tint-head">
            <span className="tp-tint-icon" aria-hidden="true">
              <ChatCircleDots size={18} weight="duotone" />
            </span>
            <span className="tp-tint-count">Helpdesk</span>
          </div>
          <strong>Bantuan &amp; status pesanan</strong>
          <p>Lanjutkan pembayaran hold yang masih berjalan, buka QR tiket aktif, atau sampaikan kendala perjalanan.</p>
          <div style={{display: 'flex', flexWrap: 'wrap', gap: '12px', marginTop: '3px'}}>
            <Link href="/tickets" className="tp-tint-link">
              Cek pesanan saya <ArrowRight size={13} aria-hidden="true" />
            </Link>
            <Link href="/pengaduan" className="tp-tint-link">
              Hubungi Helpdesk <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </aside>

      <dialog
        ref={dialog}
        className="sp-filter-dialog"
        aria-labelledby="filter-title"
        onClose={() => trigger.current?.focus()}
        onClick={event => {
          if (event.target === event.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect();
            if (
              event.clientX < rect.left ||
              event.clientX > rect.right ||
              event.clientY < rect.top ||
              event.clientY > rect.bottom
            ) {
              dialog.current?.close();
            }
          }
        }}
      >
        <form
          onSubmit={event => {
            event.preventDefault();
            setClasses(draftClasses);
            setMaxFare(draftFare);
            dialog.current?.close();
          }}
        >
          <div className="sp-filter-heading">
            <h2 id="filter-title">Filter perjalanan</h2>
            <button
              className="sp-icon-button"
              type="button"
              aria-label="Tutup filter"
              onClick={() => dialog.current?.close()}
            >
              <X size={22} aria-hidden="true" />
            </button>
          </div>
          <fieldset>
            <legend>Kelas layanan</legend>
            {options.length ? (
              <div className="sp-chip-grid">
                {options.map(name => (
                  <label
                    className={`sp-toggle-chip${draftClasses.includes(name) ? ' is-selected' : ''}`}
                    key={name}
                  >
                    <input
                      className="sp-sr"
                      type="checkbox"
                      checked={draftClasses.includes(name)}
                      onChange={event =>
                        setDraftClasses(current =>
                          event.target.checked ? [...current, name] : current.filter(item => item !== name),
                        )
                      }
                    />
                    {name}
                  </label>
                ))}
              </div>
            ) : (
              <p className="sp-muted">Kelas tersedia setelah perjalanan ditemukan.</p>
            )}
          </fieldset>
          <div className="sp-fare-filter-group">
            <span className="sp-filter-sublabel">Batas harga cepat</span>
            <div className="sp-chip-grid">
              {FARE_PRESETS.map(preset => (
                <button
                  key={preset.value}
                  type="button"
                  className={`sp-toggle-chip${draftFare === preset.value ? ' is-selected' : ''}`}
                  aria-pressed={draftFare === preset.value}
                  onClick={() => setDraftFare(current => (current === preset.value ? '' : preset.value))}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
          <label className="sp-fare-filter">
            Harga maksimum (Rp)
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={18}
              value={draftFare}
              placeholder="Tanpa batas harga"
              onChange={event => {
                if (/^\d*$/.test(event.target.value)) setDraftFare(event.target.value);
              }}
            />
            <span>Harga per penumpang</span>
          </label>
          <div className="sp-filter-actions">
            <button
              className="sp-secondary"
              type="button"
              onClick={() => {
                setDraftClasses([]);
                setDraftFare('');
              }}
            >
              Reset
            </button>
            <button className="sp-primary" type="submit">
              Terapkan
            </button>
          </div>
        </form>
      </dialog>
    </div>
  );
}
