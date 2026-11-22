import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import ThemeToggle from '@/app/components/theme-toggle';
import {
  THEME_STORAGE_KEY,
  applyThemeTransition,
  computeRevealOrigin,
  nextThemeMode,
  parseThemeMode,
} from '@/app/components/theme-mode';
import AdminTopbar from '@/app/admin/components/admin-topbar';
import SuperAdminShell from '@/app/super-admin/components/super-admin-shell';
import CrewShell from '@/app/crew/components/crew-shell';
import HelpdeskShell from '@/app/helpdesk/components/helpdesk-shell';

vi.mock('next/font/google', () => ({
  Inter: () => ({ variable: 'test-inter' }),
  Geist: () => ({ variable: 'test-geist' }),
  Plus_Jakarta_Sans: () => ({ variable: 'test-jakarta' }),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin/companies/a',
}));

describe('Operational + Crew Dark Mode & circular View Transitions', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('parses theme values and toggles modes deterministically', () => {
    expect(THEME_STORAGE_KEY).toBe('seatpax.ops-mode');
    expect(parseThemeMode('dark')).toBe('dark');
    expect(parseThemeMode('light')).toBe('light');
    expect(parseThemeMode('system')).toBeNull();
    expect(nextThemeMode('light')).toBe('dark');
    expect(nextThemeMode('dark')).toBe('light');
  });

  it('computes reveal origin from pointer clicks or button center and covers the furthest corner', () => {
    const pointer = computeRevealOrigin(
      { left: 100, top: 20, width: 36, height: 36 },
      { clientX: 1120, clientY: 28 },
      { width: 1280, height: 800 },
    );
    expect(pointer.x).toBe(1120);
    expect(pointer.y).toBe(28);
    expect(pointer.radius).toBeCloseTo(Math.hypot(1120, 800 - 28), 3);

    const keyboard = computeRevealOrigin(
      { left: 100, top: 20, width: 36, height: 36 },
      { clientX: 0, clientY: 0 },
      { width: 1280, height: 800 },
    );
    expect(keyboard.x).toBe(118);
    expect(keyboard.y).toBe(38);
    expect(keyboard.radius).toBeCloseTo(Math.hypot(1280 - 118, 800 - 38), 3);
  });

  it('runs circular View Transitions expand animation in both directions when supported', async () => {
    const dataset: Record<string, string> = { mode: 'light' };
    const animate = vi.fn();
    const startViewTransition = vi.fn((cb: () => void) => {
      cb();
      return { ready: Promise.resolve(), finished: Promise.resolve() };
    });

    vi.stubGlobal('window', {
      innerWidth: 1280,
      innerHeight: 800,
      localStorage: { setItem: vi.fn(), getItem: vi.fn(() => null) },
      dispatchEvent: vi.fn(),
      matchMedia: () => ({ matches: false }),
    });
    vi.stubGlobal('document', {
      documentElement: { dataset, animate },
      startViewTransition,
    });

    const commit = vi.fn();
    const fakeButton = {
      getBoundingClientRect: () => ({ left: 1100, top: 12, width: 36, height: 36 }),
    } as unknown as HTMLElement;

    await applyThemeTransition({
      target: 'dark',
      button: fakeButton,
      point: { clientX: 1118, clientY: 30 },
      onSyncCommit: commit,
    });

    expect(startViewTransition).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledWith('dark');
    expect(dataset.mode).toBe('dark');
    expect(dataset.themeTransition).toBeUndefined();
    expect(animate).toHaveBeenCalledWith(
      {
        clipPath: [
          'circle(0px at 1118px 30px)',
          `circle(${Math.hypot(1118, 770)}px at 1118px 30px)`,
        ],
      },
      expect.objectContaining({
        pseudoElement: '::view-transition-new(root)',
      }),
    );
  });

  it('skips View Transitions when prefers-reduced-motion is enabled', async () => {
    const dataset: Record<string, string> = { mode: 'dark' };
    const startViewTransition = vi.fn();

    vi.stubGlobal('window', {
      innerWidth: 1280,
      innerHeight: 800,
      localStorage: { setItem: vi.fn(), getItem: vi.fn(() => 'dark') },
      dispatchEvent: vi.fn(),
      matchMedia: () => ({ matches: true }),
    });
    vi.stubGlobal('document', {
      documentElement: { dataset, animate: vi.fn() },
      startViewTransition,
    });

    const commit = vi.fn();
    await applyThemeTransition({
      target: 'light',
      button: null,
      point: null,
      onSyncCommit: commit,
    });

    expect(startViewTransition).not.toHaveBeenCalled();
    expect(commit).toHaveBeenCalledWith('light');
    expect(dataset.mode).toBe('light');
  });

  it('mounts accessible theme toggle controls across Admin PO, Super Admin, Crew, and Helpdesk only', () => {
    const toggleHtml = render(h(ThemeToggle, { showLabel: true, fullLabel: true }));
    expect(toggleHtml).toContain('ops-theme-toggle');
    expect(toggleHtml).toContain('Aktifkan mode gelap');
    expect(toggleHtml).toContain('Mode gelap');

    const topbarHtml = render(h(AdminTopbar, { companyId: 'a', companyName: 'Demo PO A' }));
    expect(topbarHtml).toContain('ops-theme-toggle');
    expect(topbarHtml).toContain('Aktifkan mode gelap');

    const superHtml = render(h(SuperAdminShell, null, 'Body'));
    expect(superHtml).toContain('ops-theme-toggle');
    expect(superHtml).toContain('Gelap');

    const crewHtml = render(h(CrewShell, null, 'Crew body'));
    expect(crewHtml).toContain('ops-theme-toggle');
    expect(crewHtml).toContain('Gelap');

    const helpdeskHtml = render(h(HelpdeskShell, null, 'Helpdesk body'));
    expect(helpdeskHtml).toContain('ops-theme-toggle');
    expect(helpdeskHtml).toContain('Aktifkan mode gelap');

    const rootLayout = readFileSync('app/layout.tsx', 'utf8');
    expect(rootLayout).toContain('THEME_STORAGE_KEY');
    expect(rootLayout).toContain('document.documentElement.dataset.mode=m');
    expect(rootLayout).toContain('suppressHydrationWarning');

    const opsDarkCss = readFileSync('app/styles/ops-dark.css', 'utf8');
    expect(opsDarkCss).toContain('::view-transition-new(root)');
    expect(opsDarkCss).toContain('--ops-paper: #0e1015');
    expect(opsDarkCss).toContain('sp-brand-img-dark');
    expect(opsDarkCss).not.toContain('.passenger-shell');
    expect(opsDarkCss).not.toContain('.lp-hero');

    const superHtmlBrand = render(h(SuperAdminShell, null, 'Body'));
    expect(superHtmlBrand).toContain('seatpax-horizontal-dark.png');
  });
});
