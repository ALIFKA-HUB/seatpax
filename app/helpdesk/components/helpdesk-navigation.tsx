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
