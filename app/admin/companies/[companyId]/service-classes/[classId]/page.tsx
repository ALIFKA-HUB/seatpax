import { notFound } from 'next/navigation';
import AdminBackLink from '@/app/admin/components/admin-back-link';
import MasterForm from '@/app/admin/components/master-form';
import { companyData } from '@/app/admin/data';

export default async function Page({
  params,
}: {
  params: Promise<{ companyId: string; classId: string }>;
}) {
  const { companyId, classId } = await params;
  const { data } = await companyData(companyId);
  const current = data.classes.find(c => c.id === classId);
  if (!current) notFound();

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <AdminBackLink
            href={`/admin/companies/${companyId}/service-classes`}
            label="Kelas layanan"
          />
          <h1>{current.name}</h1>
          <p>Kode kelas: {current.code ?? '—'}</p>
        </div>
        <div className="dash-hero-actions">
          <span
            className={`admin-status-pill ${current.status === 'ACTIVE' ? 'is-ok' : 'is-neutral'}`}
          >
            {current.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
      </header>

      <section className="dash-card admin-panel-modern">
        <div className="admin-panel-head">
          <h2>Edit kelas layanan</h2>
        </div>
        <MasterForm
          key={current.id}
          companyId={companyId}
          kind="class"
          initial={current}
          redirectTo={`/admin/companies/${companyId}/service-classes`}
        />
      </section>
    </div>
  );
}
