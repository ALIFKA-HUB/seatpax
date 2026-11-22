import { describe, expect, it, vi } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import CrewShell from '@/app/crew/components/crew-shell';
import CrewNavigation, { isCrewTripsActive } from '@/app/crew/components/crew-navigation';
import CrewTopbar, { resolveCrewTopbarTitle } from '@/app/crew/components/crew-topbar';
import CrewTripTabs from '@/app/crew/components/trip-tabs';
import CrewTripSummary from '@/app/crew/components/trip-summary';
import ManifestList from '@/app/crew/components/manifest-list';
import type { TripDetail, TripRecord } from '@/modules/trip/types';
import type { ManifestView } from '@/modules/boarding/types';
import {
  IconArrowLeft,
  IconArrowRight,
  IconCalendar,
  IconCamera,
  IconCheck,
  IconClipboard,
  IconClock,
  IconInfo,
  IconMapPin,
  IconMapTrifold,
  IconPackage,
  IconQrCode,
  IconSearch,
  IconStop,
  IconVan,
} from '@/app/crew/components/crew-icons';

const mockTrips: TripRecord[] = [
  {
    id: 'trip-1',
    companyId: 'company-1',
    name: 'Perjalanan Pagi',
    routeId: 'route-1',
    vehicleId: 'vehicle-1',
    serviceClassId: 'class-1',
    departureAt: '2026-10-10T01:00:00Z',
    salesCloseAt: null,
    revision: 1,
    status: 'OPEN_FOR_SALE',
    publishedAt: '2026-10-09T01:00:00Z',
    identity: {
      routeName: 'Bandung → Bogor',
      routeCode: null,
      routeRevision: 1,
      vehicleName: 'Bus A',
      plateNumber: 'B 1234 DEM',
      vehicleRevision: 1,
      className: 'Eksekutif',
      classCode: 'E',
      templateId: 'layout-1',
      templateVersion: 1,
    },
  },
  {
    id: 'trip-2',
    companyId: 'company-1',
    name: 'Perjalanan Siang',
    routeId: 'route-2',
    vehicleId: 'vehicle-1',
    serviceClassId: 'class-1',
    departureAt: '2026-10-10T06:00:00Z',
    salesCloseAt: null,
    revision: 1,
    status: 'OPEN_FOR_SALE',
    publishedAt: '2026-10-09T01:00:00Z',
    identity: {
      routeName: 'Jakarta → Bandung',
      routeCode: null,
      routeRevision: 1,
      vehicleName: 'Bus A',
      plateNumber: 'B 1234 DEM',
      vehicleRevision: 1,
      className: 'VIP',
      classCode: 'V',
      templateId: 'layout-1',
      templateVersion: 1,
    },
  },
];

const listMineMock = vi.fn(async () => mockTrips);
vi.mock('@/app/crew/data', () => ({
  crewData: async () => ({
    actorId: 'actor-1',
    crew: { listMine: listMineMock },
  }),
}));

describe('Task 1: CrewShell, CrewNavigation, CrewTopbar, and Phosphor crew-icons Admin PO layout', () => {
  it('renders 2-column Admin PO workspace shell with sticky sidebar, role summary card, topbar, toast viewport, and skip link', () => {
    const html = render(h(CrewShell, null, 'Konten utama crew'));

    expect(html).toContain('class="crew-shell"');
    expect(html).toContain('href="#crew-main"');
    expect(html).toContain('class="crew-sidebar"');
    expect(html).toContain('aria-label="Seatpax"');
    expect(html).toContain('href="/crew"');
    expect(html).toContain('crew-company-card');
    expect(html).toContain('Operasional');
    expect(html).toContain('Perjalanan saya');
    expect(html).toContain('Ke Seatpax');
    expect(html).toContain('Keluar dari akun');
    expect(html).toContain('Akhiri sesi Crew');
    expect(html).toContain('class="crew-workspace"');
    expect(html).toContain('class="crew-topbar"');
    expect(html).toContain('Petugas Crew');
    expect(html).toContain('ops-theme-toggle');
    expect(html).toContain('Gelap');
    expect(html).toContain('id="crew-main"');
    expect(html).toContain('Konten utama crew');
    expect(html).not.toContain('href="/account"');
  });

  it('places mobile navigation drawer immediately after CrewTopbar and before #crew-main for natural forward Tab focus order', () => {
    const closedHtml = render(h(CrewShell, { defaultMenuOpen: false, children: 'Body' }));
    expect(closedHtml).not.toContain('id="crew-mobile-navigation"');

    const openHtml = render(h(CrewShell, { defaultMenuOpen: true, children: 'Body' }));
    expect(openHtml).toContain('id="crew-mobile-navigation"');
    expect(openHtml).toContain('class="crew-mobile-drawer"');

    const topbarIndex = openHtml.indexOf('class="crew-topbar"');
    const drawerIndex = openHtml.indexOf('id="crew-mobile-navigation"');
    const mainIndex = openHtml.indexOf('id="crew-main"');

    expect(topbarIndex).toBeGreaterThan(-1);
    expect(drawerIndex).toBeGreaterThan(topbarIndex);
    expect(mainIndex).toBeGreaterThan(drawerIndex);
  });

  it('resolves dynamic CrewTopbar breadcrumbs and CrewNavigation active states across all 5 /crew routes', () => {
    expect(isCrewTripsActive('/crew')).toBe(true);
    expect(isCrewTripsActive('/crew/trips/trip-1')).toBe(true);
    expect(isCrewTripsActive('/crew/trips/trip-1/manifest')).toBe(true);
    expect(isCrewTripsActive('/crew/trips/trip-1/scan')).toBe(true);
    expect(isCrewTripsActive('/crew/trips/trip-1/passengers/t-1')).toBe(true);

    expect(resolveCrewTopbarTitle('/crew')).toEqual({
      group: 'Operasional',
      title: 'Perjalanan saya',
    });
    expect(resolveCrewTopbarTitle('/crew/trips/trip-1')).toEqual({
      group: 'Operasional',
      title: 'Info rute & denah',
    });
    expect(resolveCrewTopbarTitle('/crew/trips/trip-1/manifest')).toEqual({
      group: 'Operasional',
      title: 'Manifest & check-in',
    });
    expect(resolveCrewTopbarTitle('/crew/trips/trip-1/scan')).toEqual({
      group: 'Operasional',
      title: 'Scan QR tiket',
    });
    expect(resolveCrewTopbarTitle('/crew/trips/trip-1/passengers/t-1')).toEqual({
      group: 'Operasional',
      title: 'Profil penumpang',
    });

    const navHtml = render(h(CrewNavigation, null));
    expect(navHtml).toContain('aria-label="Navigasi Crew"');
    expect(navHtml).toContain('Operasional');
    expect(navHtml).toContain('Perjalanan saya');
    expect(navHtml).toContain('aria-current="page"');

    const topbarHtml = render(h(CrewTopbar, { menuOpen: false }));
    expect(topbarHtml).toContain('aria-label="Header Crew"');
    expect(topbarHtml).toContain('Operasional');
    expect(topbarHtml).toContain('Perjalanan saya');
    expect(topbarHtml).toContain('Petugas Crew');
  });

  it('re-exports crisp Phosphor SSR icons from crew-icons.tsx while preserving all 15 icon exports', () => {
    const iconsSource = readFileSync('app/crew/components/crew-icons.tsx', 'utf8');
    expect(iconsSource).toContain('@phosphor-icons/react/dist/ssr/');

    const icons = [
      IconArrowLeft,
      IconArrowRight,
      IconCalendar,
      IconCamera,
      IconCheck,
      IconClipboard,
      IconClock,
      IconInfo,
      IconMapPin,
      IconMapTrifold,
      IconPackage,
      IconQrCode,
      IconSearch,
      IconStop,
      IconVan,
    ];
    for (const IconComponent of icons) {
      const markup = render(h(IconComponent, { size: 18 }));
      expect(markup).toContain('<svg');
      expect(markup).toContain('viewBox="0 0 256 256"');
    }
  });
});

describe('Task 2: /crew Assigned Trips Dashboard & CrewTripTabs Admin PO Hero & Bento Geometry', () => {
  it('renders /crew populated dashboard with crew-dash-root, crew-hero, WIB date pill, 3-card KPI stat strip, crew-table-card, and zero eyebrows or middle dots', async () => {
    listMineMock.mockResolvedValueOnce(mockTrips);
    const { default: CrewPage } = await import('@/app/crew/page');
    const html = render(await CrewPage());

    expect(html).toContain('class="crew-dash-root"');
    expect(html).toContain('class="crew-hero"');
    expect(html).toContain('<h1>Perjalanan saya</h1>');
    expect(html).toContain('class="crew-date-pill"');
    expect(html).toContain('WIB');
    expect(html).toContain('class="crew-count-pill"');
    expect(html).toContain('2 jadwal aktif ditugaskan');

    // 3-card Admin PO KPI stat strip
    expect(html).toContain('class="crew-stat-grid"');
    expect(html).toContain('aria-label="Ringkasan penugasan perjalanan"');
    expect(html).toContain('crew-icon-badge is-blue');
    expect(html).toContain('crew-icon-badge is-indigo');
    expect(html).toContain('crew-icon-badge is-green');
    expect(html).toContain('Jadwal aktif ditugaskan');
    expect(html).toContain('Armada bertugas');
    expect(html).toContain('Rute beroperasi');

    // Table card wrapper & structured trip cards with separated pills (zero · middle dot)
    expect(html).toContain('class="crew-panel crew-table-card"');
    expect(html).toContain('Daftar perjalanan tugas');
    expect(html).toContain('class="crew-count"');
    expect(html).toContain('class="crew-code-pill"');
    expect(html).toContain('B 1234 DEM');
    expect(html).toContain('Eksekutif');
    expect(html).toContain('VIP');
    expect(html).toContain('Manifest &amp; Check-in');
    expect(html).toContain('Scan QR');
    expect(html).toContain('Rute &amp; Denah →');

    // Hallmark Floor compliance: zero crew-eyebrow and zero middle-dot joiners
    expect(html).not.toContain('crew-eyebrow');
    expect(html).not.toContain('Ruang kerja Crew');
    expect(html).not.toContain('·');
  });

  it('renders /crew empty state with duotone icon badge and preserves empty state copy', async () => {
    listMineMock.mockResolvedValueOnce([]);
    const { default: CrewPage } = await import('@/app/crew/page');
    const html = render(await CrewPage());

    expect(html).toContain('class="crew-dash-root"');
    expect(html).toContain('class="crew-panel crew-empty-panel"');
    expect(html).toContain('crew-empty-icon');
    expect(html).toContain('Belum ada perjalanan yang ditugaskan');
    expect(html).toContain('Admin PO akan menambahkan penugasan perjalanan untuk akun Crew ini.');
    expect(html).not.toContain('class="crew-stat-grid"');
    expect(html).not.toContain('crew-eyebrow');
    expect(html).not.toContain('·');
  });

  it('renders CrewTripTabs with Admin PO back pill, crew-hero title + status pill, 3-tab subnav across all active tabs, and zero eyebrows', () => {
    const manifestHtml = render(
      h(CrewTripTabs, {
        tripId: 'trip-1',
        tripName: 'Perjalanan Pagi',
        subtitle: 'Keberangkatan 08:00 WIB',
        active: 'manifest',
      }),
    );

    expect(manifestHtml).toContain('class="crew-page-header crew-trip-header"');
    expect(manifestHtml).toContain('class="crew-back"');
    expect(manifestHtml).toContain('Daftar perjalanan tugas');
    expect(manifestHtml).toContain('class="crew-hero"');
    expect(manifestHtml).toContain('<h1>Perjalanan Pagi</h1>');
    expect(manifestHtml).toContain('Keberangkatan 08:00 WIB');
    expect(manifestHtml).toContain('crew-status-pill is-info');
    expect(manifestHtml).toContain('Operasional Crew');
    expect(manifestHtml).toContain('aria-label="Menu operasional perjalanan"');
    expect(manifestHtml).toContain('Manifest &amp; Check-in');
    expect(manifestHtml).toContain('Scan QR Tiket');
    expect(manifestHtml).toContain('Info Rute &amp; Denah');
    expect(manifestHtml).not.toContain('crew-eyebrow');
    expect(manifestHtml).not.toContain('Operasional perjalanan kru');

    const scanHtml = render(
      h(CrewTripTabs, {
        tripId: 'trip-1',
        tripName: 'Perjalanan Pagi',
        active: 'scan',
      }),
    );
    expect(scanHtml).toContain('class="crew-subnav-link crew-subnav-active" aria-current="page" href="/crew/trips/trip-1/scan"');
    expect(scanHtml).not.toContain('crew-eyebrow');

    const summaryHtml = render(
      h(CrewTripTabs, {
        tripId: 'trip-1',
        tripName: 'Perjalanan Pagi',
        active: 'summary',
      }),
    );
    expect(summaryHtml).toContain('class="crew-subnav-link crew-subnav-active" aria-current="page" href="/crew/trips/trip-1"');
    expect(summaryHtml).not.toContain('crew-eyebrow');
  });
});

describe('Task 3: CrewTripSummary & ManifestList Admin PO Card & Table Patterns', () => {
  const mockTripDetail: TripDetail = {
    trip: mockTrips[0],
    stops: [
      {
        sourceId: 'src-1',
        stopId: 'stop-1',
        name: 'Bandung',
        city: 'Bandung',
        address: 'Terminal Leuwipanjang',
        sequence: 1,
        arrivalAt: '2026-10-10T01:00:00Z',
        departureAt: '2026-10-10T01:00:00Z',
      },
      {
        sourceId: 'src-2',
        stopId: 'stop-2',
        name: 'Bogor',
        city: 'Bogor',
        address: null,
        sequence: 2,
        arrivalAt: '2026-10-10T04:00:00Z',
        departureAt: '2026-10-10T04:00:00Z',
      },
    ],
    segments: [{ sequence: 1, fromSequence: 1, toSequence: 2, price: '60000', currency: 'IDR' }],
    seats: [{ seatCode: '01-LONG-SEAT-CODE', rowIndex: 0, colIndex: 0, label: null }],
    layout: {
      rows: 1,
      cols: 1,
      cells: [{ rowIndex: 0, colIndex: 0, type: 'SEAT', seatCode: '01-LONG-SEAT-CODE', label: null }],
    },
    inventoryCount: 1,
  };

  const mockManifestView: ManifestView = {
    tripId: 'trip-1',
    companyId: 'company-1',
    tripName: 'Perjalanan Pagi',
    departureAt: '2026-10-10T01:00:00Z',
    capacity: 30,
    passengerCount: 2,
    boardedCount: 1,
    stops: [],
    passengers: [
      {
        ticketId: 'ticket-1',
        name: 'Budi Santoso',
        seatCode: '01',
        fromName: 'Bandung',
        toName: 'Bogor',
        boarding: { boardedAt: '2026-10-10T00:45:00Z' },
        snack: { claimedAt: '2026-10-10T00:50:00Z' },
      },
      {
        ticketId: 'ticket-2',
        name: 'Siti Aminah',
        seatCode: '02',
        fromName: 'Bandung',
        toName: 'Bogor',
        boarding: null,
        snack: null,
      },
    ],
  };

  it('renders CrewTripSummary with Admin PO panel heads, separated fleet/stop badges, expandable seat layout, and zero middle-dot joiners', () => {
    const html = render(h(CrewTripSummary, { detail: mockTripDetail }));

    // Top summary card with crew-panel-head, time badge, and separated fleet pills
    expect(html).toContain('class="crew-panel crew-table-card crew-summary-card"');
    expect(html).toContain('aria-label="Ringkasan perjalanan"');
    expect(html).toContain('class="crew-panel-head"');
    expect(html).toContain('Bandung → Bogor');
    expect(html).toContain('class="crew-time-badge"');
    expect(html).toContain('class="crew-muted crew-trip-fleet"');
    expect(html).toContain('Bus A');
    expect(html).toContain('class="crew-code-pill"');
    expect(html).toContain('B 1234 DEM');
    expect(html).toContain('class="crew-status-pill is-info"');
    expect(html).toContain('Eksekutif');
    expect(html).toContain('href="/crew/trips/trip-1/scan"');
    expect(html).toContain('href="/crew/trips/trip-1/manifest"');

    // Stop schedule card with count pill, status pill, and separated stop city + address pill
    expect(html).toContain('id="crew-schedule-title"');
    expect(html).toContain('Urutan titik naik &amp; turun');
    expect(html).toContain('class="crew-status-pill is-neutral"');
    expect(html).toContain('2 pemberhentian terdaftar');
    expect(html).toContain('class="crew-muted crew-stop-location"');
    expect(html).toContain('class="crew-stop-city"');
    expect(html).toContain('class="crew-code-pill crew-stop-address"');
    expect(html).toContain('Terminal Leuwipanjang');

    // Expandable details card preserved
    expect(html).toContain('<details class="crew-panel crew-table-card crew-details"');
    expect(html).toContain('<summary>Rincian perjalanan (tarif segmen &amp; denah kursi)</summary>');
    expect(html).toContain('Tarif per segmen');
    expect(html).toContain('60.000');
    expect(html).toContain('aria-label="Denah kursi"');
    expect(html).toContain('01-LONG-SEAT-CODE');

    // Zero middle-dot characters anywhere in CrewTripSummary
    expect(html).not.toContain('·');
  });

  it('renders ManifestList with 3-card Admin PO KPI stat grid, crew-table-card wrapper, separated boarding/snack timestamp chips, and zero middle-dot joiners', () => {
    const html = render(h(ManifestList, { view: mockManifestView }));

    // 3-card Admin PO KPI strip with duotone Phosphor icon badges
    expect(html).toContain('class="manifest-counters crew-stat-grid"');
    expect(html).toContain('aria-label="Ringkasan manifest penumpang"');
    expect(html).toContain('crew-icon-badge is-blue');
    expect(html).toContain('crew-icon-badge is-indigo');
    expect(html).toContain('crew-icon-badge is-green');
    expect(html).toContain('<dt>Kapasitas kursi</dt><dd>30</dd>');
    expect(html).toContain('<dt>Total penumpang</dt><dd>2</dd>');
    expect(html).toContain('<dt>Sudah naik</dt><dd>1</dd>');

    // Table card wrapper & header
    expect(html).toContain('class="crew-panel crew-table-card"');
    expect(html).toContain('aria-label="Daftar penumpang manifest"');
    expect(html).toContain('class="crew-panel-head"');
    expect(html).toContain('Daftar penumpang <span class="crew-count">2</span>');
    expect(html).toContain('2 penumpang ditampilkan');

    // Preserved search/select controls and seat chip class
    expect(html).toContain('class="manifest-controls"');
    expect(html).toContain('class="crew-filter-pills"');
    expect(html).toContain('class="manifest-seat"');

    // Separated boarding and snack status labels + timestamp chips (zero · middle dot)
    expect(html).toContain('<span>Sudah naik</span>');
    expect(html).toContain('<span>Snack sudah diserahkan</span>');
    expect(html).toContain('class="crew-state-time"');
    expect(html).toContain('<span>Belum naik</span>');
    expect(html).toContain('<span>Snack belum diserahkan</span>');
    expect(html).toContain('href="/crew/trips/trip-1/passengers/ticket-1"');
    expect(html).toContain('href="/crew/trips/trip-1/passengers/ticket-2"');
    expect(html).not.toContain('·');
  });

  it('renders ManifestList empty state with duotone icon badge and readOnly mode without middle dots', () => {
    const emptyHtml = render(
      h(ManifestList, {
        view: { ...mockManifestView, passengerCount: 0, boardedCount: 0, passengers: [] },
      }),
    );
    expect(emptyHtml).toContain('class="crew-empty"');
    expect(emptyHtml).toContain('crew-empty-icon');
    expect(emptyHtml).toContain('Belum ada penumpang terkonfirmasi untuk perjalanan ini.');
    expect(emptyHtml).not.toContain('·');

    const readOnlyHtml = render(h(ManifestList, { view: mockManifestView, readOnly: true }));
    expect(readOnlyHtml).toContain('Manifest ini hanya untuk dibaca. Boarding dicatat crew yang ditugaskan.');
    expect(readOnlyHtml).not.toContain('/passengers/ticket-1');
    expect(readOnlyHtml).not.toContain('·');
  });
});

