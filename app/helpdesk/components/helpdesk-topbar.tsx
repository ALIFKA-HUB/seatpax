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
  const pathname = usePathname() ?? '/helpdesk';
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
