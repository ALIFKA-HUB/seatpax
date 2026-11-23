import Link from 'next/link';
import {Armchair, ArrowRight, CalendarBlank, MapPin, Tag} from '@phosphor-icons/react/ssr';
import {passengerServices} from './data';
import SearchForm from './components/search-form';
import TripDiscovery, {type WeekCalendarDay} from './components/trip-discovery';
import PassengerShell from '../components/passenger-shell';
import StatePanel from '../components/state-panel';
import {formatIdr} from '../presentation';
import {DomainError} from '@/modules/access/transaction';
import type {LocationPoint, NetworkCatalog, SearchResult} from '@/modules/inventory/types';
import {readDiscoveryQuery} from '@/modules/inventory/discovery-presentation';
import './trips.css';

export const dynamic = 'force-dynamic';

function wibDateKey(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', {timeZone: 'Asia/Jakarta'});
}

function addDaysWib(dateWib: string, days: number): string {
  const anchor = new Date(`${dateWib}T12:00:00+07:00`);
  anchor.setUTCDate(anchor.getUTCDate() + days);
  return anchor.toLocaleDateString('en-CA', {timeZone: 'Asia/Jakarta'});
}

function formatDateChip(dateWib: string) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(`${dateWib}T12:00:00+07:00`));
}

function formatHeroTodayWib(dateWib: string) {
  return new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Jakarta',
  }).format(new Date(`${dateWib}T12:00:00+07:00`));
}

function collectQuickDates(pool: SearchResult[], limit = 5): {dateWib: string; label: string}[] {
  const seen = new Set<string>();
  const dates: {dateWib: string; label: string}[] = [];
  for (const trip of pool) {
    const key = wibDateKey(trip.departureAt);
    if (!seen.has(key)) {
      seen.add(key);
      dates.push({dateWib: key, label: formatDateChip(key)});
    }
    if (dates.length >= limit) break;
  }
  return dates;
}

function dedupeTrips(pool: SearchResult[]): SearchResult[] {
  const seen = new Set<string>();
  const result: SearchResult[] = [];
  for (const trip of pool) {
    const key = `${trip.tripId}:${trip.fromStopId}:${trip.toStopId}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(trip);
    }
  }
  return result;
}

function buildWeekCalendar(
  todayWib: string,
  selectedDateWib: string,
  hasExplicitDate: boolean,
  upcomingPool: SearchResult[],
): WeekCalendarDay[] {
  const counts = new Map<string, number>();
  for (const trip of dedupeTrips(upcomingPool)) {
    const key = wibDateKey(trip.departureAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const dayFormatter = new Intl.DateTimeFormat('id-ID', {
    weekday: 'short',
    timeZone: 'Asia/Jakarta',
  });
  const numFormatter = new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    timeZone: 'Asia/Jakarta',
  });

  return Array.from({length: 7}, (_, index) => {
    const dateWib = addDaysWib(todayWib, index);
    const anchor = new Date(`${dateWib}T12:00:00+07:00`);
    return {
      dateWib,
      dayShort: dayFormatter.format(anchor).replace('.', ''),
      dateNum: Number(numFormatter.format(anchor)),
      isToday: dateWib === todayWib,
      isSelected: hasExplicitDate && dateWib === selectedDateWib,
      tripCount: counts.get(dateWib) ?? 0,
    };
  });
}

function minBigIntFare(fares: (string | null | undefined)[]): string | null {
  let lowest: bigint | null = null;
  for (const raw of fares) {
    if (!raw || !/^\d+$/.test(raw)) continue;
    const value = BigInt(raw);
    if (lowest === null || value < lowest) {
      lowest = value;
    }
  }
  return lowest !== null ? lowest.toString() : null;
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const todayWib = new Date().toLocaleDateString('en-CA', {timeZone: 'Asia/Jakarta'});
  const p = readDiscoveryQuery(raw, todayWib);
  const date = p.date;
  let locations: LocationPoint[] = [];
  let network: NetworkCatalog = {routes: [], classes: []};
  let trips: SearchResult[] = [];
  let fallbackTrips: SearchResult[] = [];
  let calendarPool: SearchResult[] = [];
  let quickDates: {dateWib: string; label: string}[] = [];
  let candidateLimitReached = false;
  let failed = false;
  let validation = '';
  let invalid = p.malformed;

  try {
    if (invalid) throw new DomainError('validation', 'Pencarian tidak valid.');
    const service = passengerServices().availability;

    if (p.from && p.to) {
      if (p.hasExplicitDate) {
        const [locs, matched, routeUpcoming, catalog] = await Promise.all([
          service.locations(),
          service.search({fromSourceStopId: p.from, toSourceStopId: p.to, dateWib: date}),
          service.searchUpcoming(p.from, p.to, 50),
          service.networkCatalog(),
        ]);
        locations = locs;
        network = catalog;
        trips = matched;
        calendarPool = [...matched, ...routeUpcoming];
        if (trips.length === 0) {
          fallbackTrips =
            routeUpcoming.length > 0 ? routeUpcoming.slice(0, 6) : (await service.discoverUpcoming(6)).trips;
        }
      } else {
        const [locs, matched, catalog] = await Promise.all([
          service.locations(),
          service.searchUpcoming(p.from, p.to, 50),
          service.networkCatalog(),
        ]);
        locations = locs;
        network = catalog;
        trips = matched;
        calendarPool = matched;
        if (trips.length === 0) {
          fallbackTrips = (await service.discoverUpcoming(6)).trips;
        }
      }
      quickDates = collectQuickDates(trips.length > 0 ? trips : fallbackTrips);
    } else if (p.from || p.to) {
      validation =
        'Pilih asal dan tujuan untuk mencari rute spesifik, atau kosongkan keduanya untuk melihat semua jadwal.';
      const [locs, upcoming, catalog] = await Promise.all([
        service.locations(),
        service.discoverUpcoming(50),
        service.networkCatalog(),
      ]);
      locations = locs;
      network = catalog;
      trips = upcoming.trips;
      calendarPool = upcoming.trips;
      candidateLimitReached = upcoming.candidateLimitReached;
    } else if (p.hasExplicitDate) {
      const [locs, dayResult, upcomingResult, catalog] = await Promise.all([
        service.locations(),
        service.discover({dateWib: date}),
        service.discoverUpcoming(50),
        service.networkCatalog(),
      ]);
      locations = locs;
      network = catalog;
      trips = dayResult.trips;
      candidateLimitReached = dayResult.candidateLimitReached;
      calendarPool = [...dayResult.trips, ...upcomingResult.trips];
      if (trips.length === 0) fallbackTrips = upcomingResult.trips.slice(0, 8);
      quickDates = collectQuickDates(upcomingResult.trips);
    } else {
      const [locs, upcoming, catalog] = await Promise.all([
        service.locations(),
        service.discoverUpcoming(50),
        service.networkCatalog(),
      ]);
      locations = locs;
      network = catalog;
      trips = upcoming.trips;
      calendarPool = upcoming.trips;
      candidateLimitReached = upcoming.candidateLimitReached;
      quickDates = collectQuickDates(upcoming.trips);
    }
  } catch (error) {
    if (error instanceof DomainError && error.code === 'validation') {
      invalid = true;
      validation = 'Pilihan pencarian tidak valid. Periksa asal, tujuan, dan tanggal.';
    } else {
      failed = true;
    }
  }

  const activePool = trips.length > 0 ? trips : fallbackTrips;
  const shownCount = activePool.length;
  const totalAvailableSeats = activePool.reduce((sum, trip) => sum + trip.availableCount, 0);
  const minFare = minBigIntFare(
    activePool.length > 0 ? activePool.map(trip => trip.fare) : network.routes.map(route => route.minSegmentFare),
  );
  const startingFareLabel = minFare ? formatIdr(minFare) : 'Sesuai rute';
  const todayLabel = formatHeroTodayWib(todayWib);
  const weekCalendar = buildWeekCalendar(todayWib, date, p.hasExplicitDate, calendarPool);

  return (
    <PassengerShell active="search">
      <div className="tp-workspace">
        <header className="tp-dash-hero" aria-labelledby="discovery-title">
          <div className="tp-dash-hero-copy">
            <h1 id="discovery-title">Jadwal Perjalanan Shuttle</h1>
            <p>
              Pilih titik naik dan turun, periksa ketersediaan kursi secara langsung, lalu tahan kursi pilihan Anda
              sebelum checkout.
            </p>
          </div>
          <div className="tp-dash-hero-actions">
            <span className="tp-date-pill">
              <CalendarBlank size={16} weight="bold" aria-hidden="true" />
              <span>{todayLabel}</span>
            </span>
            <Link href="/tickets" className="tp-hero-link-pill">
              Pesanan saya
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </header>

        {!failed && !invalid && (
          <div className="tp-kpi-grid" role="region" aria-label="Ringkasan perjalanan">
            <article className="tp-kpi-card">
              <div className="tp-kpi-top">
                <span className="tp-icon-badge is-blue" aria-hidden="true">
                  <CalendarBlank size={22} weight="duotone" />
                </span>
                <div className="tp-kpi-meta">
                  <strong className="tp-kpi-value">{shownCount}</strong>
                  <span className="tp-kpi-label">Jadwal tersedia</span>
                </div>
              </div>
              <div className="tp-kpi-foot">
                <span>
                  {trips.length > 0
                    ? 'Siap dipilih kursi'
                    : fallbackTrips.length > 0
                      ? 'Jadwal terdekat'
                      : `${network.routes.length} rute terdaftar`}
                </span>
                <a href="#results-title" className="tp-dash-link">
                  Lihat jadwal <ArrowRight size={13} aria-hidden="true" />
                </a>
              </div>
            </article>

            <article className="tp-kpi-card">
              <div className="tp-kpi-top">
                <span className="tp-icon-badge is-green" aria-hidden="true">
                  <Armchair size={22} weight="duotone" />
                </span>
                <div className="tp-kpi-meta">
                  <strong className="tp-kpi-value">
                    {activePool.length > 0 ? totalAvailableSeats : network.routes.length}
                  </strong>
                  <span className="tp-kpi-label">
                    {activePool.length > 0 ? 'Kursi siap dipesan' : 'Rute aktif'}
                  </span>
                </div>
              </div>
              <div className="tp-kpi-foot">
                <span>
                  {activePool.length > 0 ? `Dari ${activePool.length} jadwal terbuka` : 'Jaringan shuttle aktif'}
                </span>
                <a href={activePool.length > 0 ? '#results-title' : '#direktori-titik'} className="tp-dash-link">
                  Lihat armada <ArrowRight size={13} aria-hidden="true" />
                </a>
              </div>
            </article>

            <article className="tp-kpi-card">
              <div className="tp-kpi-top">
                <span className="tp-icon-badge is-teal" aria-hidden="true">
                  <MapPin size={22} weight="duotone" />
                </span>
                <div className="tp-kpi-meta">
                  <strong className="tp-kpi-value">{locations.length}</strong>
                  <span className="tp-kpi-label">Titik naik &amp; turun</span>
                </div>
              </div>
              <div className="tp-kpi-foot">
                <span>{network.classes.length > 0 ? `${network.classes.length} kelas layanan` : 'Titik aktif'}</span>
                <a href="#direktori-titik" className="tp-dash-link">
                  Lihat direktori <ArrowRight size={13} aria-hidden="true" />
                </a>
              </div>
            </article>

            <article className="tp-kpi-card">
              <div className="tp-kpi-top">
                <span className="tp-icon-badge is-amber" aria-hidden="true">
                  <Tag size={22} weight="duotone" />
                </span>
                <div className="tp-kpi-meta">
                  <strong className="tp-kpi-value">{startingFareLabel}</strong>
                  <span className="tp-kpi-label">Tarif mulai</span>
                </div>
              </div>
              <div className="tp-kpi-foot">
                <span>{activePool.length > 0 ? 'Per kursi satu arah' : 'Estimasi segmen rute'}</span>
                <a href={activePool.length > 0 ? '#results-title' : '#direktori-titik'} className="tp-dash-link">
                  Cek tarif <ArrowRight size={13} aria-hidden="true" />
                </a>
              </div>
            </article>
          </div>
        )}

        <SearchForm
          key={`${p.from ?? ''}-${p.to ?? ''}-${p.hasExplicitDate ? date : ''}`}
          locations={locations}
          initial={{from: p.from, to: p.to, date, hasExplicitDate: p.hasExplicitDate}}
        />

        {validation && (
          <p role="alert" className="sp-search-validation">
            {validation}
          </p>
        )}

        {failed ? (
          <StatePanel
            title="Perjalanan belum dapat dimuat"
            tone="danger"
            action={
              <Link className="sp-secondary" href="/trips">
                Coba lagi
              </Link>
            }
          >
            <p>Koneksi ke jadwal perjalanan sedang bermasalah. Coba muat ulang sebentar lagi.</p>
          </StatePanel>
        ) : invalid ? (
          <StatePanel
            title="Periksa pilihan perjalanan"
            action={
              <Link href="/trips" className="sp-secondary">
                Tampilkan semua jadwal
              </Link>
            }
          >
            <p>Gunakan titik asal, tujuan, dan tanggal yang valid.</p>
          </StatePanel>
        ) : (
          <TripDiscovery
            key={`${p.from ?? ''}-${p.to ?? ''}-${p.hasExplicitDate ? date : 'all'}`}
            trips={trips}
            fallbackTrips={fallbackTrips}
            locations={locations}
            corridors={network.routes}
            serviceClasses={network.classes}
            weekCalendar={weekCalendar}
            quickDates={quickDates}
            candidateLimitReached={candidateLimitReached}
            dateWib={date}
            hasExplicitDate={p.hasExplicitDate}
            from={p.from}
            to={p.to}
          />
        )}
      </div>
    </PassengerShell>
  );
}
