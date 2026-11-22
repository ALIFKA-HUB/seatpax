'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarBlank } from '@phosphor-icons/react/dist/ssr/CalendarBlank';

export function isCrewTripsActive(pathname: string): boolean {
  return pathname === '/crew' || pathname.startsWith('/crew/');
}

export default function CrewNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname() ?? '/crew';
  const active = isCrewTripsActive(pathname);

  return (
    <nav aria-label="Navigasi Crew">
      <p className="crew-nav-caption">Operasional</p>
      <Link href="/crew" onClick={onNavigate} aria-current={active ? 'page' : undefined}>
        <CalendarBlank size={20} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
        <span className="crew-nav-label">Perjalanan saya</span>
      </Link>
    </nav>
  );
}
