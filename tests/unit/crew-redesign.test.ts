import { describe, expect, it, vi } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import CrewShell from '@/app/crew/components/crew-shell';
import CrewNavigation, { isCrewTripsActive } from '@/app/crew/components/crew-navigation';
import CrewTopbar, { resolveCrewTopbarTitle } from '@/app/crew/components/crew-topbar';
import CrewTripTabs from '@/app/crew/components/trip-tabs';
import type { TripRecord } from '@/modules/trip/types';
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
