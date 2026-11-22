import Link from 'next/link';
import type { ReactNode } from 'react';
import Brand from '@/app/components/brand';
import AdminNavigation from './admin-navigation';
import AdminTopbar from './admin-topbar';
import AdminToastViewport from './admin-toast';
import { UserCircle } from '@phosphor-icons/react/ssr';
import { Plus_Jakarta_Sans } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', display: 'swap' });

export default function AdminShell({
  companyId,
  companyName,
  children,
  complaintCount,
}: {
  companyId: string;
  companyName: string;
  children: ReactNode;
  complaintCount?: number;
}) {
  return (
    <div className={`admin-shell ${jakarta.variable}`}>
      <a className="admin-skip" href="#admin-main">
        Lewati ke konten
      </a>

      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Brand href="/admin" />
        </div>

        <div className="admin-sidebar-body">
          <AdminNavigation complaintCount={complaintCount} base={`/admin/companies/${companyId}`} />

          <div className="admin-account-wrap">
            <Link href="/account" className="admin-account">
              <UserCircle size={20} aria-hidden="true" />
              <span>
                <strong>Akun &amp; keluar</strong>
                <small>Kelola sesi Anda</small>
              </span>
            </Link>
          </div>
        </div>
      </aside>

      <div className="admin-workspace">
        <AdminTopbar
          companyId={companyId}
          companyName={companyName}
          complaintCount={complaintCount}
        />
        <main className="admin-main" id="admin-main" tabIndex={-1}>
          {children}
        </main>
        <AdminToastViewport />
      </div>
    </div>
  );
}
