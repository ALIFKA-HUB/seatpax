import AdminBackLink from '@/app/admin/components/admin-back-link';
import RouteEditor from '@/app/admin/components/route-editor';
import { companyData } from '@/app/admin/data';

export default async function Page({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params;
  const { data } = await companyData(companyId);

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <AdminBackLink href={`/admin/companies/${companyId}/routes`} label="Semua rute" />
          <h1>Rute baru</h1>
          <p>Susun urutan titik naik &amp; turun serta estimasi waktu keberangkatan antar-stop.</p>
        </div>
      </header>

      <section className="dash-card admin-panel-modern">
        <div className="admin-panel-head">
          <h2>Informasi &amp; urutan stop</h2>
        </div>
        <RouteEditor companyId={companyId} choices={data.stops} />
      </section>
    </div>
  );
}
