'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell } from '@phosphor-icons/react/ssr';

const SECTION_TITLES: readonly { segment: string; title: string; group: string }[] = [
  { segment: 'trips', title: 'Perjalanan', group: 'Operasional' },
  { segment: 'routes', title: 'Rute & tarif', group: 'Operasional' },
  { segment: 'stops', title: 'Titik naik & turun', group: 'Operasional' },
  { segment: 'vehicles', title: 'Armada', group: 'Operasional' },
  { segment: 'seat-templates', title: 'Template kursi', group: 'Operasional' },
  { segment: 'service-classes', title: 'Kelas layanan', group: 'Operasional' },
  { segment: 'payment-conflicts', title: 'Konflik pembayaran', group: 'Operasional' },
  { segment: 'helpdesk-staff', title: 'Petugas Helpdesk', group: 'Pesanan' },
  { segment: 'helpdesk', title: 'Pengaduan pelanggan', group: 'Pesanan' },
];

export default function AdminTopbar({
  companyId,
  companyName,
  complaintCount,
}: {
  companyId: string;
  companyName: string;
  complaintCount?: number;
}) {
  const pathname = usePathname();
  const base = `/admin/companies/${companyId}`;
  const current = SECTION_TITLES.find(
    s => pathname === `${base}/${s.segment}` || pathname.startsWith(`${base}/${s.segment}/`),
  );
  const title = current?.title ?? 'Dashboard';
  const group = current?.group ?? 'Ringkasan';

  return (
    <header className="admin-topbar" aria-label="Header Admin PO">
      <div className="admin-topbar-left">
        <span className="admin-topbar-group">{group}</span>
        <span className="admin-topbar-sep" aria-hidden="true">/</span>
        <strong className="admin-topbar-title">{title}</strong>
      </div>

      <div className="admin-topbar-right">
        <span className="admin-topbar-company">{companyName}</span>
        <Link
          href={`${base}/helpdesk`}
          className="admin-topbar-icon-btn"
          aria-label={
            typeof complaintCount === 'number' && complaintCount > 0
              ? `Pengaduan pelanggan (${complaintCount} belum selesai)`
              : 'Pengaduan pelanggan'
          }
          title="Pengaduan pelanggan"
        >
          <Bell size={18} weight="regular" aria-hidden="true" />
          {typeof complaintCount === 'number' && complaintCount > 0 && (
            <span className="admin-topbar-dot" aria-hidden="true">
              {complaintCount}
            </span>
          )}
        </Link>
      </div>
    </header>
  );
}
