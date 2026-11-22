import type { ReactNode } from 'react';
import Brand from '@/app/components/brand';
import SessionLogoutButton from '@/app/components/session-logout-button';
import AdminNavigation from './admin-navigation';
import AdminTopbar from './admin-topbar';
import AdminToastViewport from './admin-toast';
import { SignOut } from '@phosphor-icons/react/dist/ssr/SignOut';
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
          <Brand href="/admin" darkAware />
        </div>

        <div className="admin-sidebar-body">
          <AdminNavigation complaintCount={complaintCount} base={`/admin/companies/${companyId}`} />

          <div className="admin-account-wrap">
            <SessionLogoutButton
              className="admin-account"
              errorClassName="admin-account-error"
              idleContent={
                <>
                  <SignOut size={20} aria-hidden="true" />
                  <span>
                    <strong>Keluar dari akun</strong>
                    <small>Akhiri sesi Admin PO</small>
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
