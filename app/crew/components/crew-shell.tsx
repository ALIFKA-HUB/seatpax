'use client';

import { type ComponentType, type ReactNode, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowSquareOut } from '@phosphor-icons/react/dist/ssr/ArrowSquareOut';
import { Bus } from '@phosphor-icons/react/dist/ssr/Bus';
import { SignOut } from '@phosphor-icons/react/dist/ssr/SignOut';
import Brand from '@/app/components/brand';
import SessionLogoutButton from '@/app/components/session-logout-button';
import ThemeToggle from '@/app/components/theme-toggle';
import CrewNavigation from './crew-navigation';
import CrewTopbar from './crew-topbar';

function LazyAdminToastViewport() {
  const [Viewport, setViewport] = useState<ComponentType | null>(null);

  useEffect(() => {
    let active = true;
    void import('@/app/admin/components/admin-toast').then(mod => {
      if (active) setViewport(() => mod.default);
    });
    return () => {
      active = false;
    };
  }, []);

  return Viewport ? <Viewport /> : null;
}

export default function CrewShell({
  children,
  defaultMenuOpen = false,
}: {
  children: ReactNode;
  defaultMenuOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultMenuOpen);
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
    <div className="crew-account-wrap">
      <Link href="/" className="crew-footer-link" onClick={closeMenu}>
        <ArrowSquareOut size={18} aria-hidden="true" />
        <span>Ke Seatpax</span>
      </Link>
      <SessionLogoutButton
        className="crew-account crew-nav-logout"
        errorClassName="crew-account-error crew-nav-error"
        idleContent={
          <>
            <SignOut size={20} aria-hidden="true" />
            <span>
              <strong>Keluar dari akun</strong>
              <small>Akhiri sesi Crew</small>
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
    <div className="crew-shell">
      <a className="crew-skip" href="#crew-main">
        Lewati ke konten
      </a>

      <aside className="crew-sidebar">
        <div className="crew-brand">
          <Brand href="/crew" darkAware />
        </div>

        <div className="crew-sidebar-body">
          <div className="crew-company-card">
            <span className="crew-company-avatar" aria-hidden="true">
              <Bus size={17} weight="duotone" />
            </span>
            <span>
              <strong>Operasional Crew</strong>
              <small>Boarding &amp; manifest</small>
            </span>
          </div>

          <CrewNavigation onNavigate={closeMenu} />
          {footerActions}
        </div>
      </aside>

      <div className="crew-workspace">
        <CrewTopbar
          menuOpen={open}
          onToggleMenu={() => setOpen(prev => !prev)}
          toggleRef={toggleRef}
        />
        {open && (
          <div className="crew-mobile-drawer" id="crew-mobile-navigation">
            <CrewNavigation onNavigate={closeMenu} />
            <div className="crew-mobile-theme-row">
              <ThemeToggle showLabel fullLabel className="crew-footer-link" />
            </div>
            {footerActions}
          </div>
        )}
        <main className="crew-main" id="crew-main" tabIndex={-1}>
          {children}
        </main>
        <LazyAdminToastViewport />
      </div>
    </div>
  );
}
