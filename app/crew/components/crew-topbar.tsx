'use client';

import type { RefObject } from 'react';
import { usePathname } from 'next/navigation';
import { List } from '@phosphor-icons/react/dist/ssr/List';
import { X } from '@phosphor-icons/react/dist/ssr/X';
import ThemeToggle from '@/app/components/theme-toggle';

export function resolveCrewTopbarTitle(pathname: string): { group: string; title: string } {
  if (/^\/crew\/trips\/[^/]+\/passengers\/[^/]+/.test(pathname)) {
    return { group: 'Operasional', title: 'Profil penumpang' };
  }
  if (/^\/crew\/trips\/[^/]+\/manifest/.test(pathname)) {
    return { group: 'Operasional', title: 'Manifest & check-in' };
  }
  if (/^\/crew\/trips\/[^/]+\/scan/.test(pathname)) {
    return { group: 'Operasional', title: 'Scan QR tiket' };
  }
  if (/^\/crew\/trips\/[^/]+/.test(pathname)) {
    return { group: 'Operasional', title: 'Info rute & denah' };
  }
  return { group: 'Operasional', title: 'Perjalanan saya' };
}

export default function CrewTopbar({
  menuOpen = false,
  onToggleMenu,
  toggleRef,
}: {
  menuOpen?: boolean;
  onToggleMenu?: () => void;
  toggleRef?: RefObject<HTMLButtonElement | null>;
}) {
  const pathname = usePathname() ?? '/crew';
  const { group, title } = resolveCrewTopbarTitle(pathname);

  return (
    <header className="crew-topbar" aria-label="Header Crew">
      <div className="crew-topbar-left">
        {onToggleMenu && (
          <button
            ref={toggleRef}
            type="button"
            className="crew-topbar-icon-btn crew-menu-btn"
            aria-expanded={menuOpen}
            aria-controls="crew-mobile-navigation"
            aria-label={menuOpen ? 'Tutup navigasi' : 'Buka navigasi'}
            onClick={onToggleMenu}
          >
            {menuOpen ? <X size={18} aria-hidden="true" /> : <List size={18} aria-hidden="true" />}
          </button>
        )}
        <span className="crew-topbar-group">{group}</span>
        <span className="crew-topbar-sep" aria-hidden="true">/</span>
        <strong className="crew-topbar-title">{title}</strong>
      </div>

      <div className="crew-topbar-right">
        <span className="crew-topbar-role">Petugas Crew</span>
        <ThemeToggle className="crew-theme-toggle" showLabel />
      </div>
    </header>
  );
}
