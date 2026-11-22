import { describe, expect, it } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import CrewShell from '@/app/crew/components/crew-shell';
import CrewNavigation, { isCrewTripsActive } from '@/app/crew/components/crew-navigation';
import CrewTopbar, { resolveCrewTopbarTitle } from '@/app/crew/components/crew-topbar';
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
