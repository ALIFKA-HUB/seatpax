import Link from 'next/link';
import { IconArrowLeft, IconClipboard, IconMapTrifold, IconQrCode } from './crew-icons';

type Tab = 'manifest' | 'scan' | 'summary';

export default function CrewTripTabs({
  tripId,
  tripName,
  subtitle,
  active,
}: {
  tripId: string;
  tripName: string;
  subtitle?: string;
  active: Tab;
}) {
  const tabs: readonly { id: Tab; label: string; href: string; icon: typeof IconClipboard }[] = [
    { id: 'manifest', label: 'Manifest & Check-in', href: `/crew/trips/${tripId}/manifest`, icon: IconClipboard },
    { id: 'scan', label: 'Scan QR Tiket', href: `/crew/trips/${tripId}/scan`, icon: IconQrCode },
    { id: 'summary', label: 'Info Rute & Denah', href: `/crew/trips/${tripId}`, icon: IconMapTrifold },
  ];

  return (
    <header className="crew-page-header crew-trip-header">
      <Link className="crew-back" href="/crew">
        <IconArrowLeft size={16} />
        <span>Daftar perjalanan tugas</span>
      </Link>
      <div className="crew-hero">
        <div className="crew-head-copy">
          <h1>{tripName}</h1>
          {subtitle && <p className="crew-muted crew-head-sub">{subtitle}</p>}
        </div>
        <span className="crew-status-pill is-info">Operasional Crew</span>
      </div>
      <nav className="crew-subnav" aria-label="Menu operasional perjalanan">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isCurrent = tab.id === active;
          return (
            <Link
              key={tab.id}
              href={tab.href}
              className={isCurrent ? 'crew-subnav-link crew-subnav-active' : 'crew-subnav-link'}
              aria-current={isCurrent ? 'page' : undefined}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
