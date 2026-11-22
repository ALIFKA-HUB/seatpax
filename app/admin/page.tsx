import Link from 'next/link';
import { redirect } from 'next/navigation';
import { adminCompanies } from './data';
import Brand from '@/app/components/brand';
import SessionLogoutButton from '@/app/components/session-logout-button';
import './admin.css';
import './admin-refresh.css';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const companies = await adminCompanies();
  if (companies.length === 1) redirect(`/admin/companies/${companies[0].id}`);

  return (
    <main className="admin-entry">
      <div className="admin-entry-top">
        <Brand href="/admin" />
      </div>
      <header className="admin-header">
        <p>Admin PO</p>
        <h1>Pilih perusahaan</h1>
        <span className="admin-entry-sub">
          Pilih workspace operator bus yang ingin Anda kelola hari ini.
        </span>
      </header>
      {companies.length ? (
        <ul>
          {companies.map(c => (
            <li key={c.id}>
              <Link href={`/admin/companies/${c.id}`}>
                <span className="admin-entry-item">
                  <span className="admin-entry-avatar" aria-hidden="true">
                    {Array.from(c.name.trim())[0] ?? 'P'}
                  </span>
                  <span>{c.name}</span>
                </span>
                <span className="admin-entry-arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="admin-entry-empty">Akun ini belum memiliki akses admin PO.</p>
      )}
      <div className="admin-entry-actions">
        <Link className="admin-entry-back" href="/trips">
          ← Lihat perjalanan
        </Link>
        <SessionLogoutButton
          className="admin-entry-back admin-entry-logout"
          errorClassName="admin-message"
          idleContent="Keluar dari akun"
          pendingContent="Keluar…"
        />
      </div>
    </main>
  );
}
