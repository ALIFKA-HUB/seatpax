import { expect, it, vi } from 'vitest';
import { renderToStaticMarkup as render } from 'react-dom/server';
import type { AdminDashboardData } from '@/app/admin/dashboard-data';

const mockDashboardData = vi.fn<() => Promise<AdminDashboardData>>();
vi.mock('@/app/admin/dashboard-data', () => ({
  adminDashboardData: () => mockDashboardData(),
}));

import Page from '@/app/admin/companies/[companyId]/page';

const baseData: AdminDashboardData = {
  companyId: '00000000-0000-4000-8000-000000000001',
  companyName: 'Demo PO <A>',
  nowWibLabel: 'Kamis, 19 Nov 2026',
  monthYearWibLabel: 'November 2026',
  kpis: {
    openTrips: 2,
    draftTrips: 1,
    totalTrips: 3,
    confirmedBookings: 14,
    openConflicts: 1,
    openComplaints: 2,
  },
  resources: {
    routes: 4,
    stops: 9,
    vehicles: 3,
    templates: 2,
    classes: 2,
  },
  upcomingTrips: [
    {
      id: 'trip-1',
      name: 'Bandung - Jakarta Pagi',
      status: 'OPEN_FOR_SALE',
      departureAt: '2026-11-20T01:00:00.000Z',
      routeName: 'Bandung - Jakarta',
      vehicleName: 'HiAce 01',
      className: 'Eksekutif',
      bookedCount: 6,
      seatCapacity: 10,
    },
  ],
  dailyActivity: [
    { dayKey: '2026-11-13', dayShort: 'Jum', dateNum: 13, count: 2 },
    { dayKey: '2026-11-14', dayShort: 'Sab', dateNum: 14, count: 4 },
    { dayKey: '2026-11-15', dayShort: 'Min', dateNum: 15, count: 3 },
    { dayKey: '2026-11-16', dayShort: 'Sen', dateNum: 16, count: 1 },
    { dayKey: '2026-11-17', dayShort: 'Sel', dateNum: 17, count: 2 },
    { dayKey: '2026-11-18', dayShort: 'Rab', dateNum: 18, count: 0 },
    { dayKey: '2026-11-19', dayShort: 'Kam', dateNum: 19, count: 2 },
  ],
  weekStrip: [
    { dayShort: 'Sen', dateNum: 16, isToday: false, tripCount: 0 },
    { dayShort: 'Sel', dateNum: 17, isToday: false, tripCount: 0 },
    { dayShort: 'Rab', dateNum: 18, isToday: false, tripCount: 0 },
    { dayShort: 'Kam', dateNum: 19, isToday: true, tripCount: 1 },
    { dayShort: 'Jum', dateNum: 20, isToday: false, tripCount: 1 },
    { dayShort: 'Sab', dateNum: 21, isToday: false, tripCount: 0 },
    { dayShort: 'Min', dateNum: 22, isToday: false, tripCount: 0 },
  ],
};

it('renders Admin PO dashboard KPIs, upcoming trip agenda, and operational resources', async () => {
  mockDashboardData.mockResolvedValueOnce(baseData);
  const html = render(await Page({ params: Promise.resolve({ companyId: baseData.companyId }) }));

  for (const expected of [
    'Selamat datang, Demo PO &lt;A&gt;',
    'Jadwal aktif dijual',
    'Pesanan terkonfirmasi',
    'Perlu tindak lanjut',
    'Aktivitas Pemesanan 7 Hari',
    'Master Operasional PO',
    'Agenda Keberangkatan',
    'Bandung - Jakarta Pagi',
    '6/10 kursi',
    'Konflik Pembayaran',
    'Pengaduan Pelanggan',
    `/admin/companies/${baseData.companyId}/trips/trip-1`,
    `/admin/companies/${baseData.companyId}/payment-conflicts`,
    `/admin/companies/${baseData.companyId}/helpdesk`,
  ]) {
    expect(html).toContain(expected);
  }
});

it('renders truthful empty states when no trips or bookings exist yet', async () => {
  mockDashboardData.mockResolvedValueOnce({
    ...baseData,
    kpis: {
      openTrips: 0,
      draftTrips: 0,
      totalTrips: 0,
      confirmedBookings: 0,
      openConflicts: 0,
      openComplaints: 0,
    },
    upcomingTrips: [],
    dailyActivity: baseData.dailyActivity.map(d => ({ ...d, count: 0 })),
  });
  const html = render(await Page({ params: Promise.resolve({ companyId: baseData.companyId }) }));

  expect(html).toContain('Belum ada pemesanan terkonfirmasi dalam 7 hari terakhir');
  expect(html).toContain('Belum ada keberangkatan terjadwal');
  expect(html).toContain('Buat jadwal pertama');
  expect(html).toContain('Tidak ada konflik pembayaran yang menunggu pemeriksaan');
});
