import Link from 'next/link';
import {passengerServices} from './data';
import SearchForm from './components/search-form';
import TripDiscovery from './components/trip-discovery';
import PassengerShell from '../components/passenger-shell';
import StatePanel from '../components/state-panel';
import {DomainError} from '@/modules/access/transaction';
import type {LocationPoint, SearchResult} from '@/modules/inventory/types';
import {readDiscoveryQuery} from '@/modules/inventory/discovery-presentation';
import './trips.css';

export const dynamic = 'force-dynamic';

const quickDateFormatter = new Intl.DateTimeFormat('id-ID', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'Asia/Jakarta',
});

function wibDateKey(iso: string) {
  return new Date(iso).toLocaleDateString('en-CA', {timeZone: 'Asia/Jakarta'});
}

function collectQuickDates(pool: SearchResult[], limit = 5): {dateWib: string; label: string}[] {
  const seen = new Set<string>();
  const dates: {dateWib: string; label: string}[] = [];
  for (const trip of pool) {
    const key = wibDateKey(trip.departureAt);
    if (!seen.has(key)) {
      seen.add(key);
      dates.push({
        dateWib: key,
        label: quickDateFormatter.format(new Date(`${key}T12:00:00+07:00`)),
      });
    }
    if (dates.length >= limit) break;
  }
  return dates;
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
  let trips: SearchResult[] = [];
  let fallbackTrips: SearchResult[] = [];
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
        const [locs, matched, routeUpcoming] = await Promise.all([
          service.locations(),
          service.search({fromSourceStopId: p.from, toSourceStopId: p.to, dateWib: date}),
          service.searchUpcoming(p.from, p.to, 50),
        ]);
        locations = locs;
        trips = matched;
        if (trips.length === 0) {
          fallbackTrips =
            routeUpcoming.length > 0 ? routeUpcoming.slice(0, 6) : (await service.discoverUpcoming(6)).trips;
        }
      } else {
        const [locs, matched] = await Promise.all([
          service.locations(),
          service.searchUpcoming(p.from, p.to, 50),
        ]);
        locations = locs;
        trips = matched;
        if (trips.length === 0) {
          fallbackTrips = (await service.discoverUpcoming(6)).trips;
        }
      }
      quickDates = collectQuickDates(trips.length > 0 ? trips : fallbackTrips);
    } else if (p.from || p.to) {
      validation =
        'Pilih asal dan tujuan untuk mencari rute spesifik, atau kosongkan keduanya untuk melihat semua jadwal.';
      const [locs, upcoming] = await Promise.all([
        service.locations(),
        service.discoverUpcoming(50),
      ]);
      locations = locs;
      trips = upcoming.trips;
      candidateLimitReached = upcoming.candidateLimitReached;
      quickDates = collectQuickDates(upcoming.trips);
    } else if (p.hasExplicitDate) {
      const [locs, dayResult, upcomingResult] = await Promise.all([
        service.locations(),
        service.discover({dateWib: date}),
        service.discoverUpcoming(50),
      ]);
      locations = locs;
      trips = dayResult.trips;
      candidateLimitReached = dayResult.candidateLimitReached;
      if (trips.length === 0) fallbackTrips = upcomingResult.trips.slice(0, 8);
      quickDates = collectQuickDates(upcomingResult.trips);
    } else {
      const [locs, upcoming] = await Promise.all([
        service.locations(),
        service.discoverUpcoming(50),
      ]);
      locations = locs;
      trips = upcoming.trips;
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

  return (
    <PassengerShell active="search">
      <div className="tp-page">
        <header className="tp-head" aria-labelledby="discovery-title">
          <h1 id="discovery-title">Cari jadwal shuttle</h1>
          <p>Pilih titik naik, tujuan, dan tanggal keberangkatan untuk memesan kursi secara langsung.</p>
        </header>

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
