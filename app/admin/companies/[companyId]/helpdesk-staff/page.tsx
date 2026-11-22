import Link from 'next/link';
import { Users } from '@phosphor-icons/react/ssr';
import AdminBackLink from '@/app/admin/components/admin-back-link';
import AdminEmptyState from '@/app/admin/components/admin-empty-state';
import { helpdeskConfig } from '@/lib/env/helpdesk';
import { requireAccess } from '@/modules/access/server';
import { withAdminTransaction } from '@/modules/access/transaction';
import { getDatabase } from '@/lib/db';
import HelpdeskStaffForm from '@/app/admin/components/helpdesk-staff-form';
import '@/app/pengaduan/pengaduan.css';
import '@/app/helpdesk/helpdesk.css';

export default async function StaffPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  let staff;
  try {
    const config = helpdeskConfig();
    if (config.companyId !== companyId) throw new Error();
    const actor = await requireAccess('tenant.admin', companyId);
    staff = await withAdminTransaction(getDatabase().$client, { actorId: actor.userId, companyId }, async tx =>
      tx`select u.email,m.status from public.memberships m join public.users u on u.id=m.user_id where m.company_id=${companyId} and m.role::text='HELPDESK' order by u.email`,
    );
  } catch {}

  if (!staff) {
    return (
      <div className="dash-root hd hd-admin-monitor">
        <section className="dash-card hd-panel" role="alert">
          <h1>Petugas Helpdesk belum tersedia</h1>
          <p>
            Pengelolaan petugas belum tersedia untuk perusahaan ini atau konfigurasi Helpdesk belum
            aktif.
          </p>
          <Link className="dash-outline-cta" href={`/admin/companies/${companyId}/helpdesk`}>
            ← Kembali ke pengaduan pelanggan
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="dash-root hd hd-admin-monitor">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <AdminBackLink
            href={`/admin/companies/${companyId}/helpdesk`}
            label="Kembali ke pengaduan pelanggan"
          />
          <h1>Petugas Helpdesk</h1>
          <p>Aktifkan atau nonaktifkan akses penanganan pengaduan.</p>
        </div>
      </header>

      <div className="dash-card admin-panel-modern">
        <HelpdeskStaffForm />
      </div>

      <section className="dash-card admin-table-card">
        <div className="admin-panel-head">
          <h2>
            Daftar petugas <span className="admin-count">{staff.length}</span>
          </h2>
        </div>
        {staff.length ? (
          <div className="admin-table-wrap" role="region" aria-label="Daftar petugas Helpdesk" tabIndex={0}>
            <table className="admin-modern-table hd-staff-table">
              <thead>
                <tr>
                  <th>Email petugas</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {staff.map(s => (
                  <tr key={String(s.email)} data-row-name={String(s.email)}>
                    <td>
                      <strong>{String(s.email)}</strong>
                    </td>
                    <td>
                      <span
                        className={`admin-status-pill ${s.status === 'ACTIVE' ? 'is-ok' : 'is-neutral'}`}
                      >
                        {s.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <AdminEmptyState
            icon={<Users size={24} weight="duotone" />}
            title="Belum ada petugas Helpdesk"
            description="Tambahkan email petugas di formulir atas untuk mengaktifkan akses penanganan pengaduan."
          />
        )}
      </section>
    </div>
  );
}
