import { describe, expect, it } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import AdminManifestView from '@/app/admin/components/admin-manifest-view';
import type { ManifestView } from '@/modules/boarding/types';

const baseView: ManifestView = {
  tripId: 'trip-1',
  companyId: 'company-1',
  tripName: 'Cianjur - Bandung (Siang)',
  departureAt: '2026-10-10T05:00:00Z',
  capacity: 14,
  passengerCount: 0,
  boardedCount: 0,
  stops: [],
  passengers: [],
};

describe('AdminManifestView', () => {
  it('renders unified stat cards, read-only callout, search toolbar, and empty state when zero passengers exist', () => {
    const html = render(h(AdminManifestView, { view: baseView }));

    for (const expected of [
      'admin-stat-grid',
      'Kapasitas kursi',
      'Total penumpang',
      'Sudah naik',
      'admin-table-card',
      'Daftar penumpang',
      'Mode baca',
      'admin-callout-info',
      'hanya untuk dibaca',
      'admin-table-toolbar',
      'Status boarding',
      'Belum ada penumpang terkonfirmasi',
    ]) {
      expect(html).toContain(expected);
    }

    expect(html).not.toContain('manifest-counters');
    expect(html).not.toContain('/crew/trips/');
  });

  it('renders passenger manifest table rows with seat chips, status pills, pagination, and zero crew links', () => {
    const populated: ManifestView = {
      ...baseView,
      passengerCount: 12,
      boardedCount: 1,
      passengers: Array.from({ length: 12 }, (_, index) => ({
        ticketId: `t-${index + 1}`,
        name: index === 0 ? 'Budi <Santoso>' : `Penumpang ${index + 1}`,
        seatCode: String(index + 1).padStart(2, '0'),
        fromName: 'Cianjur Demo',
        toName: 'Bandung Demo',
        boarding: index === 0 ? { boardedAt: '2026-10-10T04:45:00Z' } : null,
        snack: index === 0 ? { claimedAt: '2026-10-10T04:50:00Z' } : null,
      })),
    };

    const html = render(h(AdminManifestView, { view: populated }));

    expect(html).toContain('admin-modern-table');
    expect(html).toContain('manifest-seat-chip');
    expect(html).toContain('Budi &lt;Santoso&gt;');
    expect(html).toContain('Cianjur Demo → Bandung Demo');
    expect(html).toContain('Sudah naik (');
    expect(html).toContain('Diserahkan (');
    expect(html).toContain('Belum naik');
    expect(html).toContain('Belum diserahkan');
    expect(html).toContain('Menampilkan 1–10 dari 12 penumpang');
    expect(html).not.toContain('Penumpang 11');
    expect(html).not.toContain('/crew/trips/');
    expect(html).not.toContain('Proses check-in');
  });
});
