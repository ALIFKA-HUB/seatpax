'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Armchair,
  Bus,
  CalendarBlank,
  ClipboardText,
  CreditCard,
  MapPin,
  Path,
  SquaresFour,
  Stack,
} from '@phosphor-icons/react/ssr';

export function isAdminSectionActive(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(href + '/');
}

export default function AdminNavigation({
  base,
  complaintCount,
}: {
  base: string;
  complaintCount?: number;
}) {
  const pathname = usePathname();
  const sections = [
    { route: 'trips', label: 'Perjalanan', Icon: CalendarBlank },
    { route: 'routes', label: 'Rute & tarif', Icon: Path },
    { route: 'stops', label: 'Titik naik & turun', Icon: MapPin },
    { route: 'vehicles', label: 'Armada', Icon: Bus },
    { route: 'seat-templates', label: 'Template kursi', Icon: Armchair },
    { route: 'service-classes', label: 'Kelas layanan', Icon: Stack },
    { route: 'payment-conflicts', label: 'Konflik pembayaran', Icon: CreditCard },
  ];

  return (
    <nav aria-label="Navigasi Admin PO">
      <p className="admin-nav-caption">Ringkasan</p>
      <Link href={base} aria-current={pathname === base ? 'page' : undefined}>
        <SquaresFour size={20} weight={pathname === base ? 'fill' : 'regular'} aria-hidden="true" />
        <span>Dashboard</span>
      </Link>

      <p className="admin-nav-caption">Operasional</p>
      {sections.map(({ route, label, Icon }) => {
        const href = `${base}/${route}`;
        const active = isAdminSectionActive(pathname, href);
        return (
          <Link key={route} href={href} aria-current={active ? 'page' : undefined}>
            <Icon size={20} weight={active ? 'fill' : 'regular'} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        );
      })}

      <p className="admin-nav-caption">Pesanan</p>
      <Link
        href={`${base}/helpdesk`}
        aria-current={isAdminSectionActive(pathname, `${base}/helpdesk`) ? 'page' : undefined}
      >
        <ClipboardText
          size={20}
          weight={isAdminSectionActive(pathname, `${base}/helpdesk`) ? 'fill' : 'regular'}
          aria-hidden="true"
        />
        <span className="admin-nav-label">Pengaduan pelanggan</span>
        {typeof complaintCount === 'number' && complaintCount > 0 && (
          <span
            className="admin-nav-badge"
            aria-label={`${complaintCount} pengaduan belum selesai`}
          >
            {complaintCount}
          </span>
        )}
      </Link>
    </nav>
  );
}
