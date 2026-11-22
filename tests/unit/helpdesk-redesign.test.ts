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
  redirect: vi.fn((url: string) => {
    throw new Error(`NEXT_REDIRECT:${url}`);
  }),
  unstable_rethrow: (error: unknown) => {
    if (error instanceof Error && error.message.startsWith('NEXT_REDIRECT:')) {
      throw error;
    }
  },
}));

vi.mock('@/app/helpdesk/data', () => ({
  helpdeskContext: mockHelpdeskContext,
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
