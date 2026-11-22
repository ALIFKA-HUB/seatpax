import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const nav = vi.hoisted(() => ({
  pathname: '/helpdesk/pengaduan',
}));

const mockHelpdeskContext = vi.hoisted(() => vi.fn());

vi.mock('next/font/google', () => ({
  Plus_Jakarta_Sans: () => ({ variable: 'test-jakarta' }),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ refresh: vi.fn() }),
  notFound: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  unstable_rethrow: (error: unknown) => {
    if (
      error instanceof Error &&
      (error.message.startsWith('NEXT_REDIRECT:') || error.message === 'NEXT_NOT_FOUND')
    ) {
      throw error;
    }
  },
}));

vi.mock('@/app/helpdesk/data', () => ({
  helpdeskContext: mockHelpdeskContext,
}));

vi.mock('@/app/helpdesk/actions', () => ({
  changeComplaintAction: vi.fn(),
  retryComplaintEmailAction: vi.fn(),
}));

import HelpdeskShell from '@/app/helpdesk/components/helpdesk-shell';
import HelpdeskNavigation from '@/app/helpdesk/components/helpdesk-navigation';
import HelpdeskTopbar from '@/app/helpdesk/components/helpdesk-topbar';

describe('Helpdesk Admin-PO unified shell', () => {
  beforeEach(() => {
    nav.pathname = '/helpdesk/pengaduan';
  });

  it('renders admin-shell chrome, grouped nav, 60px topbar breadcrumb, theme toggle, bell badge, and logout', () => {
    const html = render(
      h(HelpdeskShell, { pendingCount: 4, children: h('div', null, 'Isi workspace') }),
    );
    for (const token of [
      'admin-shell',
      'hd-workspace',
      'test-jakarta',
      'seatpax-horizontal-dark.png',
      'admin-sidebar',
      'admin-nav-caption',
      'Ringkasan',
      'Penanganan',
      'href="/helpdesk"',
      'href="/helpdesk/pengaduan"',
      'aria-current="page"',
      'admin-nav-badge',
      'admin-topbar',
      'Pengaduan pelanggan',
      'Petugas Helpdesk',
      'ops-theme-toggle',
      'admin-topbar-icon-btn',
      'hd-menu-btn',
      'href="/helpdesk/pengaduan?status=MENUNGGU"',
      'admin-topbar-dot',
      'Ke Seatpax',
      'Keluar dari akun',
      'Akhiri sesi Helpdesk',
      'Isi workspace',
    ]) {
      expect(html).toContain(token);
    }
    expect(html).not.toContain('href="/account"');

    const shellSource = readFileSync('app/helpdesk/components/helpdesk-shell.tsx', 'utf8');
    expect(shellSource).toContain('<AdminToastViewport />');

    const layoutSource = readFileSync('app/helpdesk/layout.tsx', 'utf8');
    expect(layoutSource).toContain("../admin/admin.css");
    expect(layoutSource).toContain("../admin/admin-refresh.css");
    expect(layoutSource).toContain("./helpdesk.css");
    expect(layoutSource).toContain("../styles/ops-dark.css");
    expect(layoutSource).not.toContain("pengaduan.css");
  });

  it('resolves active navigation and topbar breadcrumb across dashboard, list, and case detail routes', () => {
    nav.pathname = '/helpdesk';
    const dashNav = render(h(HelpdeskNavigation, { pendingCount: 0 }));
    expect(dashNav).toMatch(/<a(?=[^>]*href="\/helpdesk")(?=[^>]*aria-current="page")[^>]*>/);
    expect(dashNav).not.toMatch(/<a(?=[^>]*href="\/helpdesk\/pengaduan")(?=[^>]*aria-current="page")[^>]*>/);
    expect(dashNav).not.toContain('admin-nav-badge');
    const dashTopbar = render(h(HelpdeskTopbar, { pendingCount: 0, menuOpen: false, onToggleMenu: () => {} }));
    expect(dashTopbar).toContain('Ringkasan');
    expect(dashTopbar).toContain('Dashboard');
    expect(dashTopbar).toContain('Buka navigasi');
    expect(dashTopbar).not.toContain('admin-topbar-dot');

    nav.pathname = '/helpdesk/case-123';
    const detailNav = render(h(HelpdeskNavigation, { pendingCount: 2 }));
    expect(detailNav).toMatch(/<a(?=[^>]*href="\/helpdesk\/pengaduan")(?=[^>]*aria-current="page")[^>]*>/);
    expect(detailNav).not.toMatch(/<a(?=[^>]*href="\/helpdesk")(?=[^>]*aria-current="page")[^>]*>/);
    expect(detailNav).toContain('2 pengaduan belum selesai');
    const detailTopbar = render(h(HelpdeskTopbar, { pendingCount: 2, menuOpen: true, onToggleMenu: () => {} }));
    expect(detailTopbar).toContain('Penanganan');
    expect(detailTopbar).toContain('Detail pengaduan');
    expect(detailTopbar).toContain('Tutup navigasi');
    expect(detailTopbar).toContain('Pengaduan menunggu (2 belum selesai)');
  });

  it('mounts mobile drawer immediately after HelpdeskTopbar before main and preserves table header & preview button contrast rules', () => {
    const html = render(
      h(HelpdeskShell, {
        pendingCount: 3,
        defaultMenuOpen: true,
        children: h('div', null, 'Isi workspace'),
      }),
    );
    const topbarIndex = html.indexOf('hd-topbar');
    const drawerIndex = html.indexOf('id="hd-mobile-navigation"');
    const mainIndex = html.indexOf('id="hd-main"');
    expect(topbarIndex).toBeGreaterThan(-1);
    expect(drawerIndex).toBeGreaterThan(topbarIndex);
    expect(mainIndex).toBeGreaterThan(drawerIndex);
    expect(html).toContain('Mode gelap');

    const helpdeskCss = readFileSync('app/helpdesk/helpdesk.css', 'utf8');
    expect(helpdeskCss).toContain(
      ':where(.admin-shell.hd-workspace) .hd-main .hd-staff-table th{background:transparent;color:var(--admin-muted)}',
    );

    const opsDarkCss = readFileSync('app/styles/ops-dark.css', 'utf8');
    expect(opsDarkCss).toContain(':not(.hd-preview-btn)');
    expect(opsDarkCss).toContain(
      "html[data-mode='dark'] .admin-shell.hd-workspace .hd-main .hd-staff-table th",
    );
    expect(opsDarkCss).toContain('background: var(--ops-paper-3);');
  });
});

describe('Helpdesk /helpdesk dashboard & loading skeleton redesign', () => {
  beforeEach(() => {
    mockHelpdeskContext.mockReset();
  });

  it('renders /helpdesk dashboard with Admin PO hero, 4 KPI cards, bento queue/timeline, and unified table without eyebrows or middle dots', async () => {
    mockHelpdeskContext.mockResolvedValue({
      ctx: { actorId: 'u1', companyId: 'c1' },
      staff: {
        dashboard: async () => ({
          counts: { MENUNGGU: 2, DIPROSES: 1, PERLU_DILENGKAPI: 0, SELESAI: 3 },
          queue: [
            {
              id: 'case-1',
              code: 'SPX-ADU-1001',
              title: 'Dana terpotong dua kali',
              category: 'PAYMENT',
              status: 'MENUNGGU',
              priority: 'HIGH',
              created_at: '2026-11-22T01:00:00Z',
            },
          ],
          recent: [
            {
              id: 'case-1',
              code: 'SPX-ADU-1001',
              title: 'Dana terpotong dua kali',
              category: 'PAYMENT',
              status: 'MENUNGGU',
              priority: 'HIGH',
              created_at: '2026-11-22T01:00:00Z',
            },
          ],
          events: [
            {
              id: 'ev-1',
              case_id: 'case-1',
              kind: 'DIPROSES',
              created_at: '2026-11-22T02:00:00Z',
            },
          ],
        }),
      },
    });

    const { default: HelpdeskPage } = await import('@/app/helpdesk/page');
    const html = render(await HelpdeskPage());

    for (const token of [
      'dash-root',
      'dash-hero',
      'dash-date-pill',
      'dash-primary-cta',
      'hd-kpi-4',
      'dash-kpi-card',
      'dash-icon-badge',
      'is-amber',
      'is-blue',
      'is-indigo',
      'is-green',
      'dash-bento',
      'dash-primary-col',
      'dash-side-col',
      'admin-table-card',
      'admin-modern-table',
      'admin-status-pill',
      'admin-col-action',
      'hd-code-pill',
      'hd-queue-cards',
      'hd-timeline',
      'SPX-ADU-1001',
      'Pembayaran',
      'Menunggu pemeriksaan',
      'Sedang diproses',
      'Perlu dilengkapi',
      'Selesai',
      'href="/helpdesk/pengaduan?status=MENUNGGU"',
      'href="/helpdesk/case-1"',
      'Tangani →',
      'Detail →',
      'WIB',
    ]) {
      expect(html).toContain(token);
    }
    expect(html).not.toContain('hd-kicker');
    expect(html).not.toContain('hd-stat-grid');
    expect(html).not.toContain('<i aria-hidden="true"');
    expect(html).not.toContain(' · ');
  });

  it('renders empty state cleanly on /helpdesk when counts and rows are zero', async () => {
    mockHelpdeskContext.mockResolvedValue({
      ctx: { actorId: 'u1', companyId: 'c1' },
      staff: {
        dashboard: async () => ({
          counts: { MENUNGGU: 0, DIPROSES: 0, PERLU_DILENGKAPI: 0, SELESAI: 0 },
          queue: [],
          recent: [],
          events: [],
        }),
      },
    });

    const { default: HelpdeskPage } = await import('@/app/helpdesk/page');
    const html = render(await HelpdeskPage());

    expect(html).toContain('admin-empty-state');
    expect(html).toContain('Belum ada pengaduan');
    expect(html).toContain('Antrean penanganan kosong');
    expect(html).toContain('Belum ada aktivitas penanganan');
    expect(html).not.toContain('admin-modern-table');
  });

  it('renders Admin PO alert card without leaking error internals when dashboard fails to load', async () => {
    mockHelpdeskContext.mockRejectedValueOnce(new Error('secret db failure'));

    const { default: HelpdeskPage } = await import('@/app/helpdesk/page');
    const html = render(await HelpdeskPage());

    expect(html).toContain('dash-root');
    expect(html).toContain('dash-card admin-panel-modern');
    expect(html).toContain('role="alert"');
    expect(html).toContain('Dashboard belum tersedia');
    expect(html).not.toContain('secret db failure');
  });

  it('renders HelpdeskLoading skeleton with Admin PO bento geometry and Light/Dark shimmer tokens', async () => {
    const { default: HelpdeskLoading } = await import('@/app/helpdesk/loading');
    const html = render(h(HelpdeskLoading));

    for (const token of [
      'dash-root',
      'hd-loading',
      'aria-busy="true"',
      'role="status"',
      'Memuat data Helpdesk',
      'hd-kpi-4',
      'dash-bento',
      'dash-card',
      'hd-skeleton-shimmer',
    ]) {
      expect(html).toContain(token);
    }

    const helpdeskCss = readFileSync('app/helpdesk/helpdesk.css', 'utf8');
    expect(helpdeskCss).toContain('.hd-kpi-4');
    expect(helpdeskCss).toContain('.hd-queue-cards');
    expect(helpdeskCss).toContain('.hd-skeleton-shimmer');

    const opsDarkCss = readFileSync('app/styles/ops-dark.css', 'utf8');
    expect(opsDarkCss).toContain('.hd-skeleton-shimmer');
    expect(opsDarkCss).toContain('.hd-code-pill');
    expect(opsDarkCss).toContain('.admin-status-pill.is-warn');
  });

  it('redirects legacy /helpdesk query params to /helpdesk/pengaduan and renders unset priority cleanly', async () => {
    const { default: HelpdeskPage } = await import('@/app/helpdesk/page');
    await expect(
      HelpdeskPage({ searchParams: Promise.resolve({ status: 'MENUNGGU', search: 'kursi' }) }),
    ).rejects.toThrow('NEXT_REDIRECT:/helpdesk/pengaduan?status=MENUNGGU&search=kursi');

    mockHelpdeskContext.mockResolvedValue({
      ctx: { actorId: 'u1', companyId: 'c1' },
      staff: {
        dashboard: async () => ({
          counts: { MENUNGGU: 1, DIPROSES: 0, PERLU_DILENGKAPI: 0, SELESAI: 0 },
          queue: [
            {
              id: 'case-2',
              code: 'SPX-ADU-1002',
              title: 'AC kabin kurang dingin',
              category: 'JOURNEY',
              status: 'MENUNGGU',
              priority: null,
              created_at: '2026-11-22T01:30:00Z',
            },
          ],
          recent: [
            {
              id: 'case-2',
              code: 'SPX-ADU-1002',
              title: 'AC kabin kurang dingin',
              category: 'JOURNEY',
              status: 'MENUNGGU',
              priority: null,
              created_at: '2026-11-22T01:30:00Z',
            },
          ],
          events: [],
        }),
      },
    });

    const html = render(await HelpdeskPage());
    expect(html).toContain('Prioritas belum ditentukan');
    expect(html).toContain('Belum ditentukan');
    expect(html).toContain('Pelayanan perjalanan');
    expect(html).not.toContain(' · ');
  });
});

describe('Helpdesk /helpdesk/pengaduan unified CaseList redesign', () => {
  beforeEach(() => {
    mockHelpdeskContext.mockReset();
  });

  it('renders /helpdesk/pengaduan with Admin PO dash-hero, stat strip, unified status tabs, search toolbar, code pills, and pagination', async () => {
    mockHelpdeskContext.mockResolvedValue({
      ctx: { actorId: 'u1', companyId: 'c1' },
      staff: {
        list: async () => ({
          count: 5,
          hasMore: true,
          rows: [
            {
              id: 'case-99',
              code: 'SPX-ADU-9901',
              title: 'Kursi ganda tercatat',
              category: 'TICKET',
              status: 'DIPROSES',
              priority: 'MEDIUM',
              created_at: '2026-11-22T03:00:00Z',
            },
            {
              id: 'case-100',
              code: 'SPX-ADU-9902',
              title: 'Kendala jadwal keberangkatan',
              category: 'SCHEDULE',
              status: 'MENUNGGU',
              priority: null,
              created_at: '2026-11-22T04:00:00Z',
            },
          ],
        }),
        dashboard: async () => ({
          counts: { MENUNGGU: 2, DIPROSES: 1, PERLU_DILENGKAPI: 2, SELESAI: 4 },
          queue: [],
          recent: [],
          events: [],
        }),
      },
    });

    const { default: HelpdeskCases } = await import('@/app/helpdesk/pengaduan/page');
    const html = render(
      await HelpdeskCases({
        searchParams: Promise.resolve({
          status: 'DIPROSES',
          search: 'kursi',
          priority: 'MEDIUM',
          page: '1',
        }),
      }),
    );

    for (const token of [
      'dash-root',
      'dash-hero',
      'Pengaduan pelanggan',
      '5 laporan belum selesai',
      'admin-stat-grid',
      'Menunggu pemeriksaan',
      'Sedang diproses',
      'Perlu dilengkapi',
      'admin-table-card',
      'hd-status-tabs',
      'hd-admin-toolbar',
      'admin-select',
      'admin-modern-table',
      'hd-case-meta',
      'hd-code-pill',
      'SPX-ADU-9901',
      'SPX-ADU-9902',
      'Prioritas belum ditentukan',
      'admin-pagination',
      'Detail →',
      'href="/helpdesk/pengaduan?search=kursi&amp;priority=MEDIUM&amp;status=MENUNGGU"',
      'href="/helpdesk/pengaduan?status=DIPROSES&amp;search=kursi&amp;priority=MEDIUM&amp;page=2"',
    ]) {
      expect(html).toContain(token);
    }
    expect(html).toContain('Menampilkan 2 laporan (5 belum selesai)');
    expect(html).not.toContain('hd-kicker');
    expect(html).not.toContain('hd-list-controls');
    expect(html).not.toContain('hd-staff-table');
    expect(html).not.toContain(' · ');
  });

  it('renders AdminEmptyState on /helpdesk/pengaduan when no rows match and renders Admin PO alert card on failure', async () => {
    mockHelpdeskContext.mockResolvedValueOnce({
      ctx: { actorId: 'u1', companyId: 'c1' },
      staff: {
        list: async () => ({ count: 0, hasMore: false, rows: [] }),
        dashboard: async () => ({
          counts: { MENUNGGU: 0, DIPROSES: 0, PERLU_DILENGKAPI: 0, SELESAI: 0 },
          queue: [],
          recent: [],
          events: [],
        }),
      },
    });

    const { default: HelpdeskCases } = await import('@/app/helpdesk/pengaduan/page');
    const emptyHtml = render(
      await HelpdeskCases({ searchParams: Promise.resolve({}) }),
    );
    expect(emptyHtml).toContain('admin-empty-state');
    expect(emptyHtml).toContain('Belum ada laporan yang sesuai');
    expect(emptyHtml).toContain('Menampilkan 0 laporan (0 belum selesai)');
    expect(emptyHtml).not.toContain('admin-modern-table');
    expect(emptyHtml).not.toContain(' · ');

    mockHelpdeskContext.mockRejectedValueOnce(new Error('sensitive pg detail'));
    const errorHtml = render(
      await HelpdeskCases({ searchParams: Promise.resolve({}) }),
    );
    expect(errorHtml).toContain('dash-root');
    expect(errorHtml).toContain('dash-card admin-panel-modern');
    expect(errorHtml).toContain('role="alert"');
    expect(errorHtml).toContain('Daftar pengaduan belum tersedia');
    expect(errorHtml).not.toContain('sensitive pg detail');
  });

  it('unifies CaseList across embedded and standalone callers and keeps Dark Mode parity globally under .admin-shell', async () => {
    const { default: CaseList } = await import('@/app/helpdesk/components/case-list');
    const sampleData = {
      count: 1,
      hasMore: false,
      rows: [
        {
          id: 'case-1',
          code: 'SPX-ADU-1001',
          title: 'Pembayaran ganda',
          category: 'PAYMENT',
          status: 'MENUNGGU',
          priority: 'HIGH',
          created_at: '2026-11-22T01:00:00Z',
        },
      ],
    } as unknown as Parameters<typeof CaseList>[0]['data'];

    const standaloneHtml = render(h(CaseList, { data: sampleData, query: {} }));
    const embeddedHtml = render(h(CaseList, { data: sampleData, query: {}, embedded: true }));

    expect(standaloneHtml).toBe(embeddedHtml);
    expect(standaloneHtml).toContain('hd-code-pill');
    expect(standaloneHtml).toContain('SPX-ADU-1001');
    expect(standaloneHtml).toContain('hd-case-meta');
    expect(standaloneHtml).toContain('Menampilkan 1 laporan (1 belum selesai)');
    expect(standaloneHtml).not.toContain('hd-list-controls');
    expect(standaloneHtml).not.toContain(' · ');

    const helpdeskCss = readFileSync('app/helpdesk/helpdesk.css', 'utf8');
    expect(helpdeskCss).toContain('.admin-shell .hd-case-meta');

    const opsDarkCss = readFileSync('app/styles/ops-dark.css', 'utf8');
    expect(opsDarkCss).not.toContain('.hd-admin-monitor .hd-tab-count');
    expect(opsDarkCss).toContain('.hd-tab-count');
    expect(opsDarkCss).toContain("html[data-mode='dark'] .admin-shell .hd-status-tab");
    expect(opsDarkCss).toContain("html[data-mode='dark'] .admin-shell .hd-reset-link");
    expect(opsDarkCss).toContain("html[data-mode='dark'] .admin-shell .hd-search-box input");
  });
});

describe('Helpdesk /helpdesk/[id], CaseDetailView, CaseActions, and AttachmentList redesign', () => {
  beforeEach(() => {
    mockHelpdeskContext.mockReset();
  });

  it('renders /helpdesk/[id] writable detail view with AdminBackLink, status pills, AdminSelect forms, and timeline without middle dots', async () => {
    mockHelpdeskContext.mockResolvedValue({
      ctx: { actorId: 'u1', companyId: 'c1' },
      staff: {
        detail: async () => ({
          row: {
            id: '12345678-1234-4234-8234-123456789abc',
            code: 'SPX-ADU-5555',
            title: 'Kendala verifikasi tiket',
            category: 'PAYMENT',
            status: 'DIPROSES',
            priority: 'HIGH',
            name: 'Siti Aminah',
            email: 'siti@example.com',
            booking_reference: 'BK-9001',
            description: 'Kode booking belum terbaca di gate.',
            revision: 2,
          },
          events: [
            {
              id: 'e1',
              kind: 'DIPROSES',
              note: 'Sedang dicek oleh tim Helpdesk.',
              created_at: '2026-11-22T04:00:00Z',
            },
          ],
          files: [{ id: 'f1', name: 'bukti.png', mime: 'image/png', size: 20480 }],
          jobs: [
            { id: 'j1', state: 'ACCEPTED', error_code: null },
            { id: 'j2', state: 'FAILED', error_code: 'configuration' },
          ],
          writable: true,
        }),
      },
    });

    const { default: CaseDetail } = await import('@/app/helpdesk/[id]/page');
    const html = render(
      await CaseDetail({ params: Promise.resolve({ id: '12345678-1234-4234-8234-123456789abc' }) }),
    );

    for (const token of [
      'dash-root',
      'dash-hero',
      'admin-back-link',
      'href="/helpdesk/pengaduan"',
      'Kembali ke pengaduan',
      'Detail pengaduan',
      'hd-detail-summary',
      'hd-code-pill',
      'SPX-ADU-5555',
      'Pembayaran',
      'admin-status-pill',
      'hd-detail-grid',
      'admin-panel-modern',
      'hd-section-card',
      'payment-conflict-details',
      'Siti Aminah',
      'siti@example.com',
      'BK-9001',
      'hd-timeline',
      'Tindakan petugas',
      'admin-form',
      'admin-select',
      'name="priority"',
      'name="action"',
      'name="note"',
      'Simpan prioritas',
      'Simpan tindakan',
      'admin-primary',
      'admin-secondary-btn',
      'hd-mail-job-row',
      'Konfigurasi email belum lengkap',
      'Coba kirim ulang',
      '(20 KB)',
    ]) {
      expect(html).toContain(token);
    }
    expect(html).not.toContain('hd-heading');
    expect(html).not.toContain(' · ');
  });

  it('renders /helpdesk/[id] error fallback as Admin PO alert card without leaking internals and calls notFound when missing', async () => {
    mockHelpdeskContext.mockRejectedValueOnce(new Error('private detail query error'));

    const { default: CaseDetail } = await import('@/app/helpdesk/[id]/page');
    const html = render(
      await CaseDetail({ params: Promise.resolve({ id: '12345678-1234-4234-8234-123456789abc' }) }),
    );

    expect(html).toContain('dash-root');
    expect(html).toContain('dash-card admin-panel-modern hd-alert-card');
    expect(html).toContain('role="alert"');
    expect(html).toContain('Laporan tidak ditemukan');
    expect(html).toContain('Periksa kembali tautan laporan atau muat ulang halaman.');
    expect(html).toContain('href="/helpdesk/pengaduan"');
    expect(html).not.toContain('private detail query error');

    mockHelpdeskContext.mockResolvedValueOnce({
      ctx: { actorId: 'u1', companyId: 'c1' },
      staff: { detail: async () => null },
    });
    await expect(
      CaseDetail({ params: Promise.resolve({ id: '12345678-1234-4234-8234-123456789abc' }) }),
    ).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('renders unified CaseDetailView across standalone and embedded readOnly callers without middle dots', async () => {
    const { default: CaseDetailView } = await import('@/app/helpdesk/components/case-detail-view');
    const sampleDetail = {
      row: {
        id: '12345678-1234-4234-8234-123456789abc',
        code: 'SPX-ADU-7777',
        title: 'Jadwal mundur',
        category: 'JOURNEY',
        status: 'SELESAI',
        priority: null,
        name: 'Budi Santoso',
        email: 'budi@example.com',
        booking_reference: null,
        description: 'Keberangkatan terlambat 30 menit.',
        revision: 3,
      },
      events: [],
      files: [],
      jobs: [{ id: 'j3', state: 'FAILED', error_code: 'superseded' }],
      writable: true,
    } as unknown as Parameters<typeof CaseDetailView>[0]['data'];

    const standaloneReadOnly = render(
      h(CaseDetailView, { id: 'case-7', data: sampleDetail, readOnly: true }),
    );
    const embeddedReadOnly = render(
      h(CaseDetailView, { id: 'case-7', data: sampleDetail, readOnly: true, embedded: true }),
    );

    expect(standaloneReadOnly).toBe(embeddedReadOnly);
    expect(standaloneReadOnly).toContain('admin-callout-info');
    expect(standaloneReadOnly).toContain('Mode pemantauan Admin');
    expect(standaloneReadOnly).toContain('Status penanganan');
    expect(standaloneReadOnly).toContain('Prioritas belum ditentukan');
    expect(standaloneReadOnly).toContain('Laporan selesai dan tidak dapat diubah.');
    expect(standaloneReadOnly).toContain('Permintaan kelengkapan sudah ditindaklanjuti atau diganti');
    expect(standaloneReadOnly).not.toContain(' · ');
  });

  it('renders CaseActions transitions across MENUNGGU, PERLU_DILENGKAPI, and SELESAI states with queueAdminToast', async () => {
    const { default: CaseActions } = await import('@/app/helpdesk/components/case-actions');

    const waitingHtml = render(
      h(CaseActions, { id: 'c1', revision: 1, status: 'MENUNGGU', priority: null }),
    );
    expect(waitingHtml).toContain('Mulai proses');
    expect(waitingHtml).toContain('Minta kelengkapan');
    expect(waitingHtml).not.toContain('Selesaikan laporan');

    const needsInfoHtml = render(
      h(CaseActions, { id: 'c1', revision: 2, status: 'PERLU_DILENGKAPI', priority: 'MEDIUM' }),
    );
    expect(needsInfoHtml).toContain('Simpan prioritas');
    expect(needsInfoHtml).not.toContain('Simpan tindakan');

    const doneHtml = render(
      h(CaseActions, { id: 'c1', revision: 3, status: 'SELESAI', priority: 'HIGH' }),
    );
    expect(doneHtml).toContain('dash-card admin-panel-modern hd-section-card');
    expect(doneHtml).toContain('Laporan telah selesai dan tidak dapat diubah.');
    expect(doneHtml).not.toContain('<form');

    const caseActionsSource = readFileSync('app/helpdesk/components/case-actions.tsx', 'utf8');
    expect(caseActionsSource).toContain('queueAdminToast');
    expect(caseActionsSource).toContain('export async function retryMailWithRefresh');
  });

  it('uses direct /dist/csr Phosphor imports in AttachmentList and PdfPreview and covers detail + placeholder dark mode CSS', () => {
    const attachmentSource = readFileSync('app/helpdesk/components/attachment-list.tsx', 'utf8');
    expect(attachmentSource).not.toContain("from '@phosphor-icons/react'");
    expect(attachmentSource).toContain('@phosphor-icons/react/dist/csr/');
    expect(attachmentSource).not.toContain(' · ');

    const pdfPreviewSource = readFileSync('app/helpdesk/components/pdf-preview.tsx', 'utf8');
    expect(pdfPreviewSource).not.toContain("from '@phosphor-icons/react'");
    expect(pdfPreviewSource).toContain('@phosphor-icons/react/dist/csr/');

    const helpdeskCss = readFileSync('app/helpdesk/helpdesk.css', 'utf8');
    expect(helpdeskCss).toContain('.admin-secondary-btn');
    expect(helpdeskCss).toContain('.hd-mail-job-row');

    const opsDarkCss = readFileSync('app/styles/ops-dark.css', 'utf8');
    expect(opsDarkCss).toContain('.hd-mail-job-row');
    expect(opsDarkCss).toContain('.payment-conflict-details dt');
    expect(opsDarkCss).toContain('.hd-search-box input::placeholder');
    expect(opsDarkCss).toContain('color: var(--ops-muted)');
  });
});
