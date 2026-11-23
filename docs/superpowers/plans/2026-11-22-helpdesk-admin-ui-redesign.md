# Helpdesk Workspace Admin-PO UI/UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign every `/helpdesk` screen (`/helpdesk`, `/helpdesk/pengaduan`, `/helpdesk/[id]`, shell, loading state, and Dark Mode parity) to match the Admin PO `.admin-shell` / `.dash-root` UI/UX architecture without altering helpdesk authorization, server actions, mail queueing, or passenger `/pengaduan` public styles.

**Architecture:** Align `HelpdeskLayout` (`app/helpdesk/layout.tsx`) and `HelpdeskShell` (`app/helpdesk/components/helpdesk-shell.tsx`) onto the existing Admin PO CSS layer (`admin.css`, `admin-refresh.css`, `ops-dark.css`) under a combined `.admin-shell.hd-workspace` root while retaining standalone `.hd-workspace` responsive fallback rules in `app/helpdesk/helpdesk.css` so `tests/browser/helpdesk-workspace.mjs` stays valid. Unify `CaseList` and `CaseDetailView` so standalone `/helpdesk/*` routes use the exact same Admin PO table card, status tabs, `AdminSelect`, `AdminPaginationBar`, `AdminBackLink`, `.admin-status-pill`, `.hd-timeline`, and `AdminToastViewport` patterns already proven in `/admin/companies/[companyId]/helpdesk`, while upgrading `app/helpdesk/page.tsx`, `case-actions.tsx`, and `loading.tsx` to match `AdminDashboardPage` and Admin PO form panels.

**Tech Stack:** Next.js App Router (React 19 RSC + Client Components), TypeScript, Phosphor Icons (`/dist/ssr` and `/dist/csr`), Scoped Vanilla CSS (`admin.css`, `admin-refresh.css`, `helpdesk.css`, `ops-dark.css`), Vitest + Playwright.

---

## Pre-Flight & Analysis Summary

### Hallmark Pre-Flight Findings
- **Font stack:** `--font-geist` + `--font-passenger-jakarta` (`app/layout.tsx:4-5`), `--font-jakarta` inside `.admin-shell` (`app/admin/components/admin-shell.tsx:10`)
- **Palette & Dark Mode:** Light `.admin-shell` (`--admin-ink:#102746`, `--admin-muted:#526078`, `--admin-line:#e4ebf5`, `--admin-blue:#005bd1`, `#f5f8fd` canvas, `#fff` cards) + Neutral Obsidian & Charcoal dark tokens (`--ops-paper:#0e1015`, `--ops-paper-2:#151821`, `--ops-paper-3:#1c202a`, `--ops-accent:#4f96ff` in `app/styles/ops-dark.css:5-43`)
- **Existing Admin PO Helpdesk Reference:** `app/admin/companies/[companyId]/helpdesk/page.tsx:48-103`, `app/admin/companies/[companyId]/helpdesk/[id]/page.tsx:48-73`, `app/helpdesk/components/case-list.tsx:80-231` (`embedded` mode), `app/helpdesk/components/case-detail-view.tsx:21-51` (`embedded` mode), `app/admin/admin-refresh.css:431-536`
- **Gaps Found in Standalone `/helpdesk` (Before State):**
  1. `app/helpdesk/layout.tsx:1-11` imports `pengaduan.css` + `helpdesk.css` + `ops-dark.css`, NOT `admin.css` / `admin-refresh.css` / `Plus_Jakarta_Sans`.
  2. `app/helpdesk/components/helpdesk-shell.tsx:11-23` renders legacy `248px` fixed sidebar without the `60px` `.admin-topbar` breadcrumb/role/theme/bell strip, lacks `.admin-company` context card & grouped nav captions (`Ringkasan`, `Penanganan`), lacks the `3px` active rail, and lacks `<AdminToastViewport />`.
  3. `app/helpdesk/page.tsx:18-26` contains Hallmark Floor violations: eyebrow `<p className="hd-kicker">Ruang kerja Helpdesk</p>` (Floor #9), solid bright-blue `MENUNGGU` stat card & decorative status dots `<i aria-hidden="true"/>` (Floor #10), middle-dot-joined metadata `${code} · ${priority} · ${date}` (Floor #10), legacy `.hd-panel` boxes, and unstyled `.hd-staff-table` missing status/priority pills and action column.
  4. `app/helpdesk/pengaduan/page.tsx:1-14` omits status counts summary (`staff.dashboard`), and `app/helpdesk/components/case-list.tsx:234-311` falls back to a dated stacked filter form + plain table without status tabs, `AdminSelect`, `AdminPaginationBar`, `AdminEmptyState`, or `.admin-status-pill`, duplicating ~80 lines from `embedded` mode. Also `embedded` mode (`case-list.tsx:169-175`) omits the complaint code `r.code` needed by both Helpdesk and `tests/unit/helpdesk-case-list-ui.test.ts:16`.
  5. `app/helpdesk/[id]/page.tsx:13` + `case-detail-view.tsx:19,42-51` use legacy `.hd-heading`, middle-dot meta string, unpill'd text status, and raw `<select>`/`.hd-primary`/`.hd-secondary` buttons in `case-actions.tsx:7-8` instead of Admin PO `.dash-hero`, `<AdminBackLink />`, `.hd-detail-summary`, `.admin-form`, `<AdminSelect>`, and `queueAdminToast`.
  6. `app/helpdesk/loading.tsx:1-7` renders bare skeleton rectangles outside `.dash-root` card geometry.

### Hallmark Redesign Scope & Contracts
- **Hallmark:** `shape: app screen` · `redesign: full` · `modes: light+dark` · `scope: app`
- **Before -> Target:** Replaces legacy `.hd-heading` eyebrows, solid-blue card & dot indicators, middle-dot meta strings, raw `<select>` filter boxes, and sidebar-only shell with the unified `.admin-shell` (`228px` grouped sidebar + `60px` sticky `.admin-topbar` + `.dash-root` + `.dash-bento` + `.admin-table-card` + `.admin-status-pill` + `AdminToastViewport`).
- **Keeps:** All routes (`/helpdesk`, `/helpdesk/pengaduan`, `/helpdesk/[id]`), query parameters (`search`, `status`, `priority`, `page`), form field `name`s (`id`, `revision`, `action`, `priority`, `note`, `jobId`), server actions (`changeComplaintAction`, `retryComplaintEmailAction`), attachment preview dialog & `retryMailWithRefresh` contract, error/unavailable fallbacks, `Keluar dari akun`, `ThemeToggle`, and public `/pengaduan` appearance (`sp-complaints`).
- **Files Touched:**
  - Create: `app/helpdesk/components/helpdesk-topbar.tsx`, `app/helpdesk/components/helpdesk-navigation.tsx`, `tests/unit/helpdesk-redesign.test.ts`
  - Modify: `app/helpdesk/layout.tsx`, `app/helpdesk/components/helpdesk-shell.tsx`, `app/helpdesk/page.tsx`, `app/helpdesk/pengaduan/page.tsx`, `app/helpdesk/[id]/page.tsx`, `app/helpdesk/loading.tsx`, `app/helpdesk/components/case-list.tsx`, `app/helpdesk/components/case-detail-view.tsx`, `app/helpdesk/components/case-actions.tsx`, `app/helpdesk/components/attachment-list.tsx`, `app/helpdesk/helpdesk.css`, `app/styles/ops-dark.css`, `tests/unit/account-removal.test.ts`, `tests/unit/ops-dark-mode.test.ts`, `tests/unit/helpdesk-case-list-ui.test.ts`, `docs/seatpax/19_DECISION_LEDGER.md`

---

## Global Constraints

- Follow `AGENTS.md`: keep server-side auth (`helpdeskContext`, `HELPDESK` / `ADMIN_PO` role separation), do not expose PII in client error messages, preserve all existing form `name`s and server actions, and never expand MVP scope.
- Never break public `/pengaduan` styles (`body:has(.sp-complaints)` in `app/pengaduan/pengaduan.css`) or Admin PO `admin.css` / `crew.css` selector isolation tests (`tests/unit/admin-visual-contract.test.ts`, `tests/unit/crew-visual-contract.test.ts`).
- Keep `tests/browser/helpdesk-workspace.mjs` passing by preserving fallback standalone `.hd-workspace` layout selectors in `app/helpdesk/helpdesk.css` while adding `.admin-shell.hd-workspace` unified overrides cleanly.
- All Helpdesk surfaces must pass WCAG AA contrast in both Light Mode and Obsidian Charcoal Dark Mode (`app/styles/ops-dark.css`).
- No tracked-caps eyebrows (`hd-kicker`), no middle dots (`·`) joining meta strings (split with clean pills or table columns; preserve `AttachmentList` size formatting only if needed or separate meta elements), and use Phosphor icons only (`/dist/ssr/...` or `/dist/csr/...`).
- In PowerShell, never chain with `&&`; check `$LASTEXITCODE` between commands.

---

### Task 1: Unify `HelpdeskLayout`, `HelpdeskShell`, `HelpdeskTopbar`, and `HelpdeskNavigation` onto the Admin PO Shell

- **Goal:** Upgrade `/helpdesk` navigation shell from standalone `248px` sidebar-only chrome to Admin PO's `228px` grouped sidebar (`Ringkasan` / `Penanganan`), identity block, sticky `60px` `.admin-topbar` (breadcrumb + `Petugas Helpdesk` pill + `<ThemeToggle />` + pending complaints bell link), `<AdminToastViewport />`, and responsive mobile drawer compatibility.
- **Scope:** `app/helpdesk/layout.tsx`, `app/helpdesk/components/helpdesk-topbar.tsx`, `app/helpdesk/components/helpdesk-navigation.tsx`, `app/helpdesk/components/helpdesk-shell.tsx`, `app/helpdesk/helpdesk.css`, `app/styles/ops-dark.css`.
- **Dependencies:** None. Consumes existing `AdminToastViewport` (`app/admin/components/admin-toast.tsx`), `Brand` (`app/components/brand.tsx`), `SessionLogoutButton` (`app/components/session-logout-button.tsx`), `ThemeToggle` (`app/components/theme-toggle.tsx`).
- **Checkable Completion Criteria:**
  1. `HelpdeskShell` renders `.admin-shell.hd-workspace` with `Plus_Jakarta_Sans` (`--font-jakarta`), grouped `HelpdeskNavigation` (`Dashboard` & `Pengaduan` with pending count pill), `HelpdeskTopbar` (dynamic breadcrumb + `Petugas Helpdesk` badge + `ThemeToggle` + notification bell), `Ke Seatpax` link, `Keluar dari akun` button, and `AdminToastViewport`.
  2. Standalone `.hd-workspace` rules in `helpdesk.css` keep `tests/browser/helpdesk-workspace.mjs` passing across `320/390/768/1024/1440px`.
  3. `tests/unit/account-removal.test.ts`, `tests/unit/ops-dark-mode.test.ts`, and new shell tests pass.

**Files:**
- Create: `app/helpdesk/components/helpdesk-navigation.tsx`
- Create: `app/helpdesk/components/helpdesk-topbar.tsx`
- Modify: `app/helpdesk/layout.tsx:1-11`
- Modify: `app/helpdesk/components/helpdesk-shell.tsx:1-24`
- Modify: `app/helpdesk/helpdesk.css:1-21`
- Modify: `app/styles/ops-dark.css` (Helpdesk topbar/shell parity adjustments)
- Test: `tests/unit/helpdesk-redesign.test.ts` (Shell assertions)
- Update: `tests/unit/account-removal.test.ts:55-76`, `tests/unit/ops-dark-mode.test.ts:141-170`

**Interfaces:**
- Produces:
  - `HelpdeskNavigation({ pendingCount?: number, onNavigate?: () => void })`
  - `HelpdeskTopbar({ pendingCount?: number, menuOpen?: boolean, onToggleMenu?: () => void, toggleRef?: RefObject<HTMLButtonElement | null> })`
  - `HelpdeskShell({ children: ReactNode, pendingCount?: number })`

- [ ] **Step 1: Write failing unit tests for unified Helpdesk shell & topbar**

Create `tests/unit/helpdesk-redesign.test.ts` (initial suite testing `HelpdeskShell` & `HelpdeskTopbar`):
```ts
import { describe, expect, it, vi } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';

vi.mock('next/font/google', () => ({
  Plus_Jakarta_Sans: () => ({ variable: 'test-jakarta' }),
}));

vi.mock('next/navigation', () => ({
  usePathname: () => '/helpdesk/pengaduan',
  useRouter: () => ({ refresh: vi.fn() }),
}));

import HelpdeskShell from '@/app/helpdesk/components/helpdesk-shell';

describe('Helpdesk Admin-PO unified shell', () => {
  it('renders admin-shell chrome, grouped nav, 60px topbar breadcrumb, theme toggle, bell badge, and logout', () => {
    const html = render(h(HelpdeskShell, { pendingCount: 4 }, h('div', null, 'Isi workspace')));
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
      'href="/helpdesk/pengaduan?status=MENUNGGU"',
      'Ke Seatpax',
      'Keluar dari akun',
      'admin-toast-viewport',
      'Isi workspace',
    ]) {
      expect(html).toContain(token);
    }
    expect(html).not.toContain('href="/account"');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/helpdesk-redesign.test.ts`
Expected: FAIL because `HelpdeskShell` still lacks `admin-shell`, `admin-topbar`, `admin-nav-caption`, and `pendingCount` prop.

- [ ] **Step 3: Implement `helpdesk-navigation.tsx`, `helpdesk-topbar.tsx`, updated `helpdesk-shell.tsx`, and `layout.tsx`**

1. `app/helpdesk/components/helpdesk-navigation.tsx`:
```tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardText } from '@phosphor-icons/react/dist/csr/ClipboardText';
import { SquaresFour } from '@phosphor-icons/react/dist/csr/SquaresFour';

export function isHelpdeskCasesActive(pathname: string): boolean {
  return pathname.startsWith('/helpdesk/pengaduan') || /^\/helpdesk\/[^/]+/.test(pathname);
}

export default function HelpdeskNavigation({
  pendingCount,
  onNavigate,
}: {
  pendingCount?: number;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isDashboard = pathname === '/helpdesk';
  const isCases = isHelpdeskCasesActive(pathname);

  return (
    <nav aria-label="Navigasi Helpdesk">
      <p className="admin-nav-caption">Ringkasan</p>
      <Link href="/helpdesk" onClick={onNavigate} aria-current={isDashboard ? 'page' : undefined}>
        <SquaresFour size={20} weight={isDashboard ? 'fill' : 'regular'} aria-hidden="true" />
        <span className="admin-nav-label">Dashboard</span>
      </Link>

      <p className="admin-nav-caption">Penanganan</p>
      <Link
        href="/helpdesk/pengaduan"
        onClick={onNavigate}
        aria-current={isCases ? 'page' : undefined}
      >
        <ClipboardText size={20} weight={isCases ? 'fill' : 'regular'} aria-hidden="true" />
        <span className="admin-nav-label">Pengaduan</span>
        {typeof pendingCount === 'number' && pendingCount > 0 && (
          <span
            className="admin-nav-badge"
            aria-label={`${pendingCount} pengaduan belum selesai`}
          >
            {pendingCount}
          </span>
        )}
      </Link>
    </nav>
  );
}
```

2. `app/helpdesk/components/helpdesk-topbar.tsx`:
```tsx
'use client';

import type { RefObject } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from '@phosphor-icons/react/dist/csr/Bell';
import { List } from '@phosphor-icons/react/dist/csr/List';
import { X } from '@phosphor-icons/react/dist/csr/X';
import ThemeToggle from '@/app/components/theme-toggle';

function resolveTitle(pathname: string): { group: string; title: string } {
  if (pathname.startsWith('/helpdesk/pengaduan')) {
    return { group: 'Penanganan', title: 'Pengaduan pelanggan' };
  }
  if (/^\/helpdesk\/[^/]+/.test(pathname)) {
    return { group: 'Penanganan', title: 'Detail pengaduan' };
  }
  return { group: 'Ringkasan', title: 'Dashboard' };
}

export default function HelpdeskTopbar({
  pendingCount,
  menuOpen = false,
  onToggleMenu,
  toggleRef,
}: {
  pendingCount?: number;
  menuOpen?: boolean;
  onToggleMenu?: () => void;
  toggleRef?: RefObject<HTMLButtonElement | null>;
}) {
  const pathname = usePathname();
  const { group, title } = resolveTitle(pathname);

  return (
    <header className="admin-topbar hd-topbar" aria-label="Header Helpdesk">
      <div className="admin-topbar-left">
        {onToggleMenu && (
          <button
            ref={toggleRef}
            type="button"
            className="admin-topbar-icon-btn hd-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="hd-mobile-navigation"
            aria-label={menuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
            onClick={onToggleMenu}
          >
            {menuOpen ? <X size={18} aria-hidden="true" /> : <List size={18} aria-hidden="true" />}
          </button>
        )}
        <span className="admin-topbar-group">{group}</span>
        <span className="admin-topbar-sep" aria-hidden="true">/</span>
        <strong className="admin-topbar-title">{title}</strong>
      </div>

      <div className="admin-topbar-right">
        <span className="admin-topbar-company">Petugas Helpdesk</span>
        <ThemeToggle className="admin-topbar-icon-btn" />
        <Link
          href="/helpdesk/pengaduan?status=MENUNGGU"
          className="admin-topbar-icon-btn"
          aria-label={
            typeof pendingCount === 'number' && pendingCount > 0
              ? `Pengaduan menunggu (${pendingCount} belum selesai)`
              : 'Antrean pengaduan'
          }
          title="Antrean menunggu"
        >
          <Bell size={18} weight="regular" aria-hidden="true" />
          {typeof pendingCount === 'number' && pendingCount > 0 && (
            <span className="admin-topbar-dot" aria-hidden="true">
              {pendingCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
```

3. `app/helpdesk/components/helpdesk-shell.tsx`:
```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { ArrowSquareOut } from '@phosphor-icons/react/dist/csr/ArrowSquareOut';
import { SignOut } from '@phosphor-icons/react/dist/csr/SignOut';
import Brand from '@/app/components/brand';
import SessionLogoutButton from '@/app/components/session-logout-button';
import ThemeToggle from '@/app/components/theme-toggle';
import AdminToastViewport from '@/app/admin/components/admin-toast';
import HelpdeskNavigation from './helpdesk-navigation';
import HelpdeskTopbar from './helpdesk-topbar';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  display: 'swap',
});

export default function HelpdeskShell({
  children,
  pendingCount,
}: {
  children: React.ReactNode;
  pendingCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const closeMenu = () => setOpen(false);

  const footerActions = (
    <div className="admin-account-wrap hd-side-bottom">
      <Link href="/" className="hd-footer-link" onClick={closeMenu}>
        <ArrowSquareOut size={18} aria-hidden="true" />
        <span>Ke Seatpax</span>
      </Link>
      <SessionLogoutButton
        className="admin-account hd-logout-btn"
        errorClassName="admin-account-error hd-logout-error"
        idleContent={
          <>
            <SignOut size={20} aria-hidden="true" />
            <span>
              <strong>Keluar dari akun</strong>
              <small>Akhiri sesi Helpdesk</small>
            </span>
          </>
        }
        pendingContent={
          <>
            <SignOut size={20} aria-hidden="true" />
            <span>
              <strong>Keluar…</strong>
              <small>Mengakhiri sesi</small>
            </span>
          </>
        }
      />
    </div>
  );

  return (
    <div className={`admin-shell hd-workspace ${jakarta.variable}`}>
      <a className="admin-skip" href="#hd-main">
        Lewati ke konten
      </a>

      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Brand href="/helpdesk" darkAware />
        </div>

        <div className="admin-sidebar-body">
          <HelpdeskNavigation pendingCount={pendingCount} onNavigate={closeMenu} />
          {footerActions}
        </div>
      </aside>

      {open && (
        <div className="hd-mobile-drawer" id="hd-mobile-navigation">
          <HelpdeskNavigation pendingCount={pendingCount} onNavigate={closeMenu} />
          <div className="hd-mobile-theme-row">
            <ThemeToggle showLabel fullLabel className="hd-footer-link" />
          </div>
          {footerActions}
        </div>
      )}

      <div className="admin-workspace">
        <HelpdeskTopbar
          pendingCount={pendingCount}
          menuOpen={open}
          onToggleMenu={() => setOpen(prev => !prev)}
          toggleRef={toggleRef}
        />
        <main className="admin-main hd-main" id="hd-main" tabIndex={-1}>
          {children}
        </main>
        <AdminToastViewport />
      </div>
    </div>
  );
}
```

4. `app/helpdesk/layout.tsx`:
Import Admin PO CSS before `helpdesk.css` & `ops-dark.css`, and safely read non-`SELESAI` pending count inside `try/catch` without redirecting unauthenticated users (allowing page-level auth & unavailable fallbacks to handle access):
```tsx
import type { ReactNode } from 'react';
import { getVerifiedUser } from '@/modules/auth/identity';
import { helpdeskConfig } from '@/lib/env/helpdesk';
import { getDatabase } from '@/lib/db';
import '../admin/admin.css';
import '../admin/admin-refresh.css';
import './helpdesk.css';
import '../styles/ops-dark.css';
import HelpdeskShell from './components/helpdesk-shell';

export const metadata = { title: 'Helpdesk | Seatpax', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function HelpdeskLayout({ children }: { children: ReactNode }) {
  let pendingCount: number | undefined;
  try {
    const user = await getVerifiedUser();
    if (user) {
      const config = helpdeskConfig();
      const [row] = await getDatabase().$client`
        select count(*)::int as count
        from public.helpdesk_cases c
        where c.company_id = ${config.companyId}
          and c.status <> 'SELESAI'
          and exists (
            select 1 from public.memberships m
            where m.user_id = ${user.id}
              and m.company_id = ${config.companyId}
              and m.role::text in ('HELPDESK', 'ADMIN_PO')
              and m.status = 'ACTIVE'
          )
      `;
      if (row) pendingCount = Number(row.count);
    }
  } catch {}

  return <HelpdeskShell pendingCount={pendingCount}>{children}</HelpdeskShell>;
}
```

5. Update `app/helpdesk/helpdesk.css` cleanly:
   - Retain standalone `.hd-workspace:not(.admin-shell)` rules so `tests/browser/helpdesk-workspace.mjs` still validates synthetic `.hd-workspace` markup seamlessly at `320/390/768/1024/1440px`.
   - Under `.admin-shell.hd-workspace`, refine `.hd-footer-link` styling (`display:flex;align-items:center;gap:10px;padding:8px 10px;min-height:40px;border-radius:10px;font-size:13px;font-weight:500;color:var(--admin-muted);text-decoration:none;width:100%;`), `.hd-menu-btn` (hidden `>=761px`, inline-flex `<=760px`), and `@media(max-width:760px)` sliding/collapsing `.admin-sidebar` cleanly when inside `.admin-shell.hd-workspace` (showing compact `.hd-mobile-drawer` cleanly above content instead of stacking sidebar links awkwardly).
   - Update `app/styles/ops-dark.css` Helpdesk rules (`html[data-mode='dark'] .admin-shell.hd-workspace ...`) for the new `.hd-mobile-drawer` and `.hd-footer-link`.

6. Update `tests/unit/ops-dark-mode.test.ts` (mock `next/font/google` already mocked! Note `ThemeToggle` in `HelpdeskTopbar` uses icon toggle rather than `Mode gelap` string, or `hd-mobile-drawer` only renders when `open`, so check `ops-theme-toggle` + `Aktifkan mode gelap` on `HelpdeskShell`).

- [ ] **Step 4: Run tests to verify Task 1 passes**

Run: `npx vitest run tests/unit/helpdesk-redesign.test.ts tests/unit/account-removal.test.ts tests/unit/ops-dark-mode.test.ts; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node tests/browser/helpdesk-workspace.mjs`
Expected: PASS on all 3 Vitest files and synthetic Playwright responsiveness checks `[320, 390, 768, 1024, 1440]`.

- [ ] **Step 5: Commit Task 1**

```powershell
git add -- 'app/helpdesk/components/helpdesk-navigation.tsx' 'app/helpdesk/components/helpdesk-topbar.tsx' 'app/helpdesk/components/helpdesk-shell.tsx' 'app/helpdesk/layout.tsx' 'app/helpdesk/helpdesk.css' 'app/styles/ops-dark.css' 'tests/unit/helpdesk-redesign.test.ts' 'tests/unit/ops-dark-mode.test.ts'; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; git commit -m 'feat(helpdesk): unify HelpdeskShell layout with Admin PO sidebar and topbar'
```

---

### Task 2: Redesign `/helpdesk` Dashboard & `HelpdeskLoading` Skeleton Using Admin PO Bento Geometry

- **Goal:** Replace `/helpdesk/page.tsx` legacy solid-blue KPI box, eyebrow, decorative status dots, middle-dot meta strings, and plain HTML table with the Admin PO dashboard bento architecture (`.dash-root`, `.dash-hero`, `.dash-date-pill`, `.dash-kpi-card` with `.dash-icon-badge`, `.dash-card.admin-table-card` `.admin-modern-table`, `.hd-timeline` activity log, and `<AdminEmptyState>`), plus matching Admin PO bento skeleton in `app/helpdesk/loading.tsx`.
- **Scope:** `app/helpdesk/page.tsx`, `app/helpdesk/loading.tsx`, `app/helpdesk/helpdesk.css`, `app/styles/ops-dark.css`.
- **Dependencies:** Task 1 (`.admin-shell.hd-workspace` loads `admin-refresh.css` & `ops-dark.css`). Consumes existing `helpdeskContext`, `AdminEmptyState` (`app/admin/components/admin-empty-state.tsx`), `statusLabels` / `priorityLabels` / `categoryLabels`.
- **Checkable Completion Criteria:**
  1. `/helpdesk` renders zero eyebrows (`hd-kicker`), zero decorative `<i aria-hidden="true"/>` dots inside `.hd-stat`, zero `·` middle dots joining case meta (`code`, `priority`, `date`).
  2. Status summary displays 4 crisp `.dash-card.dash-kpi-card` links (`Menunggu pemeriksaan`, `Sedang diproses`, `Perlu dilengkapi`, `Selesai`) with duotone Phosphor `.dash-icon-badge` (`is-amber`, `is-blue`, `is-indigo`, `is-green`).
  3. Recent complaints use `.dash-card.admin-table-card` + `.admin-modern-table` (`Pengaduan`, `Status`, `Prioritas`, `Diterima`, `Aksi` `Detail →`) with `.admin-status-pill` badges and `<AdminEmptyState>` when empty.
  4. `Aktivitas terbaru` renders `.hd-timeline` rail; error fallback renders `.dash-card.admin-panel-modern` (`role="alert"`).
  5. `loading.tsx` renders card-matched shimmer skeleton in both Light and Obsidian Dark modes.

**Files:**
- Modify: `app/helpdesk/page.tsx:1-27`
- Modify: `app/helpdesk/loading.tsx:1-7`
- Modify: `app/helpdesk/helpdesk.css` (4-column KPI & Helpdesk dashboard bento styles)
- Test: `tests/unit/helpdesk-redesign.test.ts` (Add `/helpdesk` Dashboard full, empty, and error state assertions)

- [ ] **Step 1: Write failing tests for `/helpdesk` Dashboard redesign**

Append to `tests/unit/helpdesk-redesign.test.ts`:
```ts
const mockHelpdeskContext = vi.fn();
vi.mock('@/app/helpdesk/data', () => ({ helpdeskContext: mockHelpdeskContext }));

// Inside describe block:
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
  const html = render(await HelpdeskPage({ searchParams: Promise.resolve({}) }));

  for (const token of [
    'dash-root',
    'dash-hero',
    'dash-date-pill',
    'hd-kpi-4',
    'dash-kpi-card',
    'dash-icon-badge',
    'dash-bento',
    'admin-table-card',
    'admin-modern-table',
    'admin-status-pill',
    'admin-col-action',
    'hd-timeline',
    'SPX-ADU-1001',
    'Detail →',
  ]) {
    expect(html).toContain(token);
  }
  expect(html).not.toContain('hd-kicker');
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
  const html = render(await HelpdeskPage({ searchParams: Promise.resolve({}) }));
  expect(html).toContain('admin-empty-state');
  expect(html).toContain('Belum ada pengaduan');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/helpdesk-redesign.test.ts`
Expected: FAIL because `app/helpdesk/page.tsx` still renders legacy `hd-heading` and `hd-kicker`.

- [ ] **Step 3: Implement redesigned `app/helpdesk/page.tsx`, `app/helpdesk/loading.tsx`, and `.hd-kpi-4` / `.hd-queue-list` styles in `helpdesk.css`**

1. In `app/helpdesk/page.tsx`:
   - Build clean helper `formatWibDateTime(value: Date | string): string` (`Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', ... }) + ' WIB'`).
   - Map `statuses` (`MENUNGGU`, `DIPROSES`, `PERLU_DILENGKAPI`, `SELESAI`) to `(Icon, tone)`:
     - `MENUNGGU` -> `Clock`, `is-amber`
     - `DIPROSES` -> `ChatCircleText`, `is-blue`
     - `PERLU_DILENGKAPI` -> `WarningCircle`, `is-indigo`
     - `SELESAI` -> `CheckCircle`, `is-green`
   - Top hero (`dash-hero`): `<h1>Dashboard</h1>`, `<p>Ringkasan pengaduan dan pekerjaan yang perlu ditangani.</p>`, `.dash-date-pill` (WIB today), `<Link className="dash-primary-cta" href="/helpdesk/pengaduan">Buka daftar pengaduan</Link>`.
   - Top KPI row (`.dash-kpi-grid.hd-kpi-4`): 4 clickable `.dash-card.dash-kpi-card` cards wrapped as `<Link href={'/helpdesk/pengaduan?status=' + status}>` showing `.dash-icon-badge`, count (`admin-tabular`), `statusLabels[status]`, and `Lihat <ArrowRight size={13} />` in `.dash-kpi-foot` (matches Admin PO KPI cards cleanly!).
   - Bento row (`.dash-bento`):
     - Primary column (`.dash-primary-col`):
       - **Antrean penanganan** (`.dash-card.admin-table-card`): header `.admin-panel-head` (`<h2>Antrean penanganan <span className="admin-count">{data.queue.length}</span></h2>` + `<Link className="dash-link" href="/helpdesk/pengaduan?status=MENUNGGU">Lihat semua</Link>`). When `data.queue.length > 0`, render `.hd-queue-cards` (clean clickable cards/rows showing title, `.hd-code-pill`, category label, priority `.admin-status-pill`, WIB timestamp, and `Tangani →` without middle dots); else `<AdminEmptyState />`.
       - **Pengaduan terbaru** (`.dash-card.admin-table-card`): full `.admin-modern-table` (`Pengaduan` [title link + `.hd-code-pill` + category], `Status` `.admin-status-pill`, `Prioritas` `.admin-status-pill` or `Belum ditentukan`, `Diterima` WIB tabular date, `Aksi` `Detail →`) or `<AdminEmptyState />`.
     - Side column (`.dash-side-col`):
       - **Aktivitas terbaru** (`.dash-card`): `.dash-card-head` + `<ol className="hd-timeline">` (linking each event label to `/helpdesk/${event.case_id}`, with WIB timestamp and semantic `.is-info`/`.is-warn`/`.is-purple`/`.is-ok` node tone) or concise empty message.
   - Unavailable error state: `<div className="dash-root"><section className="dash-card admin-panel-modern" role="alert"><h1>Dashboard belum tersedia</h1>...</section></div>`.

2. In `app/helpdesk/loading.tsx`:
   - Render `.dash-root.hd-loading` with 4 `.dash-card` shimmer KPI slots + `.dash-bento` 2-column skeleton cards matching both Light & Dark tokens!

- [ ] **Step 4: Run test to verify Task 2 passes**

Run: `npx vitest run tests/unit/helpdesk-redesign.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit Task 2**

```powershell
git add -- 'app/helpdesk/page.tsx' 'app/helpdesk/loading.tsx' 'app/helpdesk/helpdesk.css' 'tests/unit/helpdesk-redesign.test.ts'; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; git commit -m 'feat(helpdesk): redesign Helpdesk dashboard and loading skeleton to Admin PO layout'
```

---

### Task 3: Unify `CaseList` & Redesign `/helpdesk/pengaduan` List Page

- **Goal:** Eliminate the legacy non-embedded form + plain table branch in `CaseList` (`app/helpdesk/components/case-list.tsx:234-312`) so `/helpdesk/pengaduan` uses the exact same Admin PO `.dash-card.admin-table-card`, `.hd-status-tabs`, `.hd-admin-toolbar` (`.hd-search-box` + `<AdminSelect>`), `.admin-modern-table`, `.admin-status-pill`, `<AdminEmptyState>`, and `<AdminPaginationBar mode="link">` as Admin PO's `/admin/companies/[companyId]/helpdesk`, while showing the complaint code `.hd-code-pill` cleanly inside table rows and adding the 3-card `.admin-stat-grid` + `.dash-hero` to `app/helpdesk/pengaduan/page.tsx`.
- **Scope:** `app/helpdesk/components/case-list.tsx`, `app/helpdesk/pengaduan/page.tsx`, `tests/unit/helpdesk-case-list-ui.test.ts`, `tests/unit/admin-table-consistency.test.ts`.
- **Dependencies:** Task 1 (`AdminSelect`, `AdminPaginationBar`, `admin-refresh.css` loaded by `HelpdeskShell`).
- **Checkable Completion Criteria:**
  1. `CaseList` renders a single unified Admin PO table card regardless of `embedded` prop (no legacy `<select>` or `.hd-list-controls` branch), while preserving `base`, `detailBase`, `statusCounts`, `SPX-...` complaint codes inside `.hd-code-pill`, and query parameter preservation across tabs and pagination links.
  2. `app/helpdesk/pengaduan/page.tsx` loads `staff.list` and `staff.dashboard` in parallel (`Promise.all`), renders `.dash-hero` (`<h1>Pengaduan pelanggan</h1>` with live active count subtitle), 3-card `.admin-stat-grid` (`Menunggu pemeriksaan`, `Sedang diproses`, `Perlu dilengkapi`), and `<CaseList statusCounts={dashboard.counts} ... />`.
  3. `tests/unit/helpdesk-case-list-ui.test.ts`, `tests/unit/admin-table-consistency.test.ts`, and `tests/unit/helpdesk-redesign.test.ts` pass.

**Files:**
- Modify: `app/helpdesk/components/case-list.tsx:39-312`
- Modify: `app/helpdesk/pengaduan/page.tsx:1-14`
- Test: `tests/unit/helpdesk-redesign.test.ts` (Add `/helpdesk/pengaduan` list & status filter tests)
- Verify: `tests/unit/helpdesk-case-list-ui.test.ts`, `tests/unit/admin-table-consistency.test.ts`

- [ ] **Step 1: Write failing tests for unified `CaseList` and `/helpdesk/pengaduan`**

Append to `tests/unit/helpdesk-redesign.test.ts`:
```ts
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
  const html = render(await HelpdeskCases({ searchParams: Promise.resolve({ status: 'DIPROSES', page: '1' }) }));

  for (const token of [
    'dash-root',
    'dash-hero',
    'Pengaduan pelanggan',
    'admin-stat-grid',
    'admin-table-card',
    'hd-status-tabs',
    'hd-admin-toolbar',
    'admin-select',
    'admin-modern-table',
    'hd-code-pill',
    'SPX-ADU-9901',
    'admin-pagination',
    'Detail →',
  ]) {
    expect(html).toContain(token);
  }
  expect(html).not.toContain('hd-kicker');
  expect(html).not.toContain('hd-list-controls');
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npx vitest run tests/unit/helpdesk-redesign.test.ts`
Expected: FAIL because `CaseList` without `embedded` still renders `hd-list-controls` and `hd-staff-table`.

- [ ] **Step 3: Unify `app/helpdesk/components/case-list.tsx` and update `app/helpdesk/pengaduan/page.tsx`**

1. In `app/helpdesk/components/case-list.tsx`:
   - Keep prop `embedded?: boolean` in type signature for backwards call compatibility (e.g. `app/admin/companies/[companyId]/helpdesk/page.tsx` passes `embedded`), and render ONLY the unified `.dash-card.admin-table-card.hd-admin-card` implementation for all callers!
   - Inside `<td className="hd-case-cell">`, render:
     ```tsx
     <Link className="hd-case-title-link" href={detailBase + '/' + r.id}>
       {String(r.title)}
     </Link>
     <div className="hd-case-meta-row">
       <span className="hd-code-pill">{String(r.code)}</span>
       <span className="hd-case-category">
         {categoryLabels[categoryKey] ?? String(r.category)}
       </span>
     </div>
     ```
   - Notice `<AdminPaginationBar mode="link" ... summary={...} />` renders `SPX-...`, preserves `href={pageHref(page + 1)}` (keeping `tests/unit/helpdesk-case-list-ui.test.ts` passing!), and `<AdminEmptyState>` handles zero rows cleanly!
2. In `app/helpdesk/pengaduan/page.tsx`:
   - Fetch `staff.list(ctx, { ...query, page: normalizeHelpdeskPage(query.page) })` and `staff.dashboard(ctx)` in `Promise.all`.
   - Render `.dash-root` with `<header className="dash-hero">` (`<h1>Pengaduan pelanggan</h1>`, `<p>{data.count} laporan belum selesai. Periksa laporan, tentukan prioritas, dan catat tindak lanjut penanganan.</p>`), `<AdminStatStrip>` / 3-card `.admin-stat-grid`, and `<CaseList data={data} query={query} statusCounts={dashboard.counts} />`.
   - Unavailable state renders `<div className="dash-root"><section className="dash-card admin-panel-modern" role="alert">...</section></div>`.

- [ ] **Step 4: Run tests to verify Task 3 passes**

Run: `npx vitest run tests/unit/helpdesk-redesign.test.ts tests/unit/helpdesk-case-list-ui.test.ts tests/unit/admin-table-consistency.test.ts`
Expected: PASS on all 3 test files.

- [ ] **Step 5: Commit Task 3**

```powershell
git add -- 'app/helpdesk/components/case-list.tsx' 'app/helpdesk/pengaduan/page.tsx' 'app/helpdesk/helpdesk.css' 'tests/unit/helpdesk-redesign.test.ts'; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; git commit -m 'feat(helpdesk): unify /helpdesk/pengaduan table and filter UI with Admin PO'
```

---

### Task 4: Redesign `/helpdesk/[id]`, `CaseDetailView`, `CaseActions`, and `AttachmentList` Icon Imports to Admin PO Detail UI

- **Goal:** Upgrade `/helpdesk/[id]` (`app/helpdesk/[id]/page.tsx`), `CaseDetailView` (`app/helpdesk/components/case-detail-view.tsx`), and `CaseActions` (`app/helpdesk/components/case-actions.tsx`) so Helpdesk detail pages match Admin PO's `/admin/companies/[companyId]/helpdesk/[id]` geometry cleanly (`.dash-hero` + `<AdminBackLink />`, `.hd-detail-summary`, `.hd-detail-grid`, `.dash-card.admin-panel-modern.hd-section-card`, `.admin-form`, `<AdminSelect>` for priority & action, `.admin-primary`/bordered secondary CTA, `queueAdminToast` popup feedback), while keeping all form fields, mail retry logic, and Admin `readOnly` monitoring intact.
- **Scope:** `app/helpdesk/[id]/page.tsx`, `app/helpdesk/components/case-detail-view.tsx`, `app/helpdesk/components/case-actions.tsx`, `app/helpdesk/components/attachment-list.tsx`, `app/helpdesk/helpdesk.css`.
- **Dependencies:** Task 1 (`AdminToastViewport`, `AdminSelect`, `admin-refresh.css`). Preserve `retryMailWithRefresh` contract (`tests/unit/helpdesk-retry-refresh.test.ts`).
- **Checkable Completion Criteria:**
  1. `/helpdesk/[id]` renders `.dash-root` -> `<header className="dash-hero">` with `<AdminBackLink href="/helpdesk/pengaduan" label="Kembali ke pengaduan" />` and `<h1>Detail pengaduan</h1>`.
  2. `CaseDetailView` renders a unified summary card (`.hd-detail-summary` with `.hd-code-pill` and `.admin-status-pill` tags — zero middle-dot string), `.hd-detail-grid` with structured reporter facts (`<dl className="payment-conflict-details">` / `.hd-meta-list`), attachments (`AttachmentList` using `/dist/csr/...` Phosphor imports, keeping preview dialog & download working), `.hd-timeline`, `<CaseActions />` (`.admin-form` + `<AdminSelect>` + `queueAdminToast`), and `Notifikasi email` status card with `RetryMail`.
  3. All existing tests (`helpdesk-retry-refresh.test.ts`, `helpdesk-attachments.test.ts`, `helpdesk-redesign.test.ts`) pass.

**Files:**
- Modify: `app/helpdesk/[id]/page.tsx:1-14`
- Modify: `app/helpdesk/components/case-detail-view.tsx:1-53`
- Modify: `app/helpdesk/components/case-actions.tsx:1-8`
- Modify: `app/helpdesk/components/attachment-list.tsx:1-14`
- Modify: `app/helpdesk/helpdesk.css` (detail reporter definition list & email job rows)
- Test: `tests/unit/helpdesk-redesign.test.ts` (Detail page writable + readOnly + CaseActions rendering assertions)

- [ ] **Step 1: Write failing tests for redesigned `/helpdesk/[id]`, `CaseDetailView`, and `CaseActions`**

Append to `tests/unit/helpdesk-redesign.test.ts`:
```ts
it('renders /helpdesk/[id] writable detail view with AdminBackLink, status pills, AdminSelect forms, and timeline without middle dots', async () => {
  mockHelpdeskContext.mockResolvedValue({
    ctx: { actorId: 'u1', companyId: 'c1' },
    staff: {
      detail: async () => ({
        row: {
          id: '12345678-1234-4234-8234-123456789abc',
          code: 'SPX-ADU-5555',
          title: 'Kendala verifikasi tiket',
          category: 'TICKET',
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
        jobs: [{ id: 'j1', state: 'ACCEPTED', error_code: null }],
        writable: true,
      }),
    },
  });

  const { default: CaseDetail } = await import('@/app/helpdesk/[id]/page');
  const html = render(await CaseDetail({ params: Promise.resolve({ id: '12345678-1234-4234-8234-123456789abc' }) }));

  for (const token of [
    'dash-root',
    'admin-back-link',
    'href="/helpdesk/pengaduan"',
    'hd-detail-summary',
    'hd-code-pill',
    'SPX-ADU-5555',
    'admin-status-pill',
    'hd-detail-grid',
    'admin-panel-modern',
    'hd-timeline',
    'Tindakan petugas',
    'admin-select',
    'name="priority"',
    'name="action"',
    'name="note"',
    'Simpan prioritas',
    'Simpan tindakan',
    'admin-primary',
  ]) {
    expect(html).toContain(token);
  }
  expect(html).not.toContain('hd-heading');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/unit/helpdesk-redesign.test.ts`
Expected: FAIL because standalone `CaseDetail` renders legacy `hd-heading` and native `<select>`.

- [ ] **Step 3: Refactor `app/helpdesk/[id]/page.tsx`, `case-detail-view.tsx`, `case-actions.tsx`, and `attachment-list.tsx`**

1. In `app/helpdesk/[id]/page.tsx`:
   - Render `.dash-root` with `<header className="dash-hero">` (`<AdminBackLink href="/helpdesk/pengaduan" label="Kembali ke pengaduan" />`, `<h1>Detail pengaduan</h1>`, `<p>Tinjau detail laporan, perbarui prioritas, dan catat hasil penanganan.</p>`) and `<CaseDetailView id={id} data={data} />`.
   - Error fallback renders `.dash-root` -> `<section className="dash-card admin-panel-modern" role="alert">...`.
2. In `app/helpdesk/components/case-detail-view.tsx`:
   - Unify `CaseDetailView` onto `.hd-detail-summary` + `.dash-card.admin-panel-modern.hd-section-card` across both Admin monitoring (`readOnly`) and Helpdesk staff (`writable`), keeping optional `backHref` when `embedded === false` handled by the page's `<AdminBackLink />` (`backHref` prop stays supported if passed!).
   - Use `.hd-detail-facts` `<dl>` for pelapor (`Nama`, `Email`, `Referensi pesanan`), clear Uraian section, `<AttachmentList />`, `.hd-timeline` history, `<CaseActions />` (or `Status penanganan` summary when read-only), and `Notifikasi email` `.admin-status-pill` + `<RetryMail />`. No middle dots (`·`) joining metadata!
3. In `app/helpdesk/components/case-actions.tsx`:
   - Keep `'use client'` and preserve `retryMailWithRefresh(jobId, refresh)` export identically.
   - Replace raw `<section className="hd-panel">` with `<section className="dash-card admin-panel-modern hd-section-card">` containing clean `.admin-form` layout:
     - Priority form with `<AdminSelect name="priority" required defaultValue={priority || ''} placeholder="Pilih prioritas" options={PRIORITY_OPTIONS} />` and `<button className="admin-secondary-btn" ...>Simpan prioritas</button>`.
     - Status transition form (`status !== 'PERLU_DILENGKAPI'`) with `<AdminSelect name="action" defaultValue={actionOptions[0].value} options={actionOptions} />`, `<label>Keterangan <textarea name="note" rows={4} maxLength={3000} /></label>`, helper `<small>`, and `<button className="admin-primary" ...>{busy ? 'Menyimpan…' : 'Simpan tindakan'}</button>`.
     - Call `queueAdminToast({ title: r.ok ? 'Pembaruan laporan tersimpan' : 'Gagal menyimpan perubahan', message: r.message, tone: r.ok ? 'ok' : 'error' })` on save & retry outcomes, while keeping `<p className="admin-message" role="status">{message}</p>` for immediate inline visibility.
4. In `app/helpdesk/components/attachment-list.tsx`:
   - Replace barrel import from `'@phosphor-icons/react'` with direct `/dist/csr/...` imports (`ArrowSquareOut`, `DownloadSimple`, `Eye`, `File`, `FilePdf`, `Image`, `X`) for fast bundling & Vitest runs, and remove `·` separator in `.hd-attachment-meta` (render `<span className="hd-code-pill">{formatKindLabel(file.mime)}</span><span>{kb} KB</span>` or `formatKindLabel` + `(${kb} KB)` cleanly without middle dot!). Wait — check `tests/unit/helpdesk-attachments.test.ts` before changing `.hd-attachment-meta` copy! Let's keep `attachment-list.tsx` text compatible if tested.

- [ ] **Step 4: Run full unit suite, typecheck, lint, and synthetic Helpdesk responsive browser script**

Run:
```powershell
npm.cmd test; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run typecheck; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; npm.cmd run lint; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node tests/browser/helpdesk-workspace.mjs
```
Expected: ALL Vitest files pass, TypeScript & ESLint exit 0, and synthetic `helpdesk-workspace.mjs` passes.

- [ ] **Step 5: Commit Task 4**

```powershell
git add -- 'app/helpdesk/[id]/page.tsx' 'app/helpdesk/components/case-detail-view.tsx' 'app/helpdesk/components/case-actions.tsx' 'app/helpdesk/components/attachment-list.tsx' 'app/helpdesk/helpdesk.css' 'tests/unit/helpdesk-redesign.test.ts'; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; git commit -m 'feat(helpdesk): align /helpdesk/[id] detail, actions, and notifications with Admin PO'
```

---

### Task 5: End-to-End Browser Acceptance (Light & Obsidian Dark Mode, Desktop & Mobile), Ledger Update, and Final Push

- **Goal:** Verify every `/helpdesk` screen live in Chromium (`http://localhost:3000` logged in as `Petugas Helpdesk` + `Admin operasional` regression check on `/admin/companies/[id]/helpdesk`), both **Light Mode** and **Obsidian Dark Mode** (`1280×800` Desktop & `390×844` Mobile), fix any visual/layout polish found, record decision in `docs/seatpax/19_DECISION_LEDGER.md`, and push `feat/autonomous-overhaul`.
- **Scope:** Live verification across `/helpdesk`, `/helpdesk/pengaduan`, `/helpdesk/[id]`, `/admin/companies/00000000-0000-4000-8000-000000000001/helpdesk`, `docs/seatpax/19_DECISION_LEDGER.md`.
- **Dependencies:** Tasks 1–4.
- **Checkable Completion Criteria:**
  1. Zero console errors, zero page errors, zero horizontal overflow across `/helpdesk`, `/helpdesk/pengaduan`, and `/helpdesk/[id]` at `1280×800` and `390×844`.
  2. Circular reveal Dark Mode toggle switches `/helpdesk` seamlessly to Obsidian Charcoal (`#0e1015` / `#151821`) with transparent `seatpax-horizontal-dark.png` logo and high contrast across KPI cards, tables, timeline, `AdminSelect`, and attachment dialog.
  3. Re-check `/admin/companies/00000000-0000-4000-8000-000000000001/helpdesk` and `/pengaduan` (Passenger public route stays crisp Light Mode).
  4. Record decision ledger entry `D2026-11-22-03`, re-run `npm.cmd test`, `typecheck`, `lint`, `git diff --check`, commit, and push to `origin/feat/autonomous-overhaul`.

- [ ] **Step 1: Verify live browser flows & visual contrast via browser subagent**
- [ ] **Step 2: Fix any visual or spacing issue observed in live browser screenshots (if any)**
- [ ] **Step 3: Update `docs/seatpax/19_DECISION_LEDGER.md`**
- [ ] **Step 4: Run final `npm.cmd test`, `npm.cmd run typecheck`, `npm.cmd run lint`, `git diff --check`**
- [ ] **Step 5: Commit documentation/polish fixes and push `origin/feat/autonomous-overhaul`**

---

## Plan Self-Review

1. **Spec & User Alignment:** Covers all pages under `/helpdesk` (`/helpdesk`, `/helpdesk/pengaduan`, `/helpdesk/[id]`, shell, loading state) using Admin PO layout/tokens/components, respecting Helpdesk RBAC (`read`/`write`) and public `/pengaduan` isolation.
2. **Hallmark Compliance:** No eyebrows (`hd-kicker`), no middle-dot metadata strings (`·`), no decorative colored dots (`hd-stat i`), no card-inside-card, full Obsidian Dark Mode + Light Mode token parity, `:focus-visible` & `prefers-reduced-motion` preserved, loading/empty/error/full states verified.
3. **Zero Placeholders:** Every task defines exact file paths, component/helper interfaces, test assertions, and exact shell commands.
4. **Test Contract Preservation:** Specifically preserves `tests/unit/helpdesk-case-list-ui.test.ts` (`SPX-...` complaint code inside rows + pagination query string assertions), `tests/unit/helpdesk-retry-refresh.test.ts` (`retryMailWithRefresh`), `tests/browser/helpdesk-workspace.mjs` (`helpdesk.css` standalone `.hd-workspace` rules), `tests/unit/account-removal.test.ts`, and `tests/unit/ops-dark-mode.test.ts`.
