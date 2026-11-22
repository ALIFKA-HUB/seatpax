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
