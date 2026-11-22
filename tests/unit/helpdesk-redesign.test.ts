import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const nav = vi.hoisted(() => ({
  pathname: '/helpdesk/pengaduan',
}));

vi.mock('next/font/google', () => ({
  Plus_Jakarta_Sans: () => ({ variable: 'test-jakarta' }),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => nav.pathname,
  useRouter: () => ({ refresh: vi.fn() }),
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
