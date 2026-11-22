import Link from 'next/link';
import { notFound } from 'next/navigation';
import AdminBackLink from '@/app/admin/components/admin-back-link';
import { companyData } from '../../../../data';
import RouteEditor from '../../../../components/route-editor';
import FareEditor from '../../../../components/fare-editor';
import QuotePreview from '../../../../components/quote-preview';

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string; routeId: string }>;
  searchParams?: Promise<{ saved?: string }>;
}) {
  const { companyId, routeId } = await params;
  const query = searchParams ? await searchParams : undefined;
  const services = await companyData(companyId);
  let detail;
  try {
    detail = await services.route.detail(services.context, routeId);
  } catch {
    notFound();
  }
  const fares = await Promise.all(
    detail.classes.map(c => services.pricing.list(services.context, routeId, c.id)),
  );
  const active = detail.route.status === 'ACTIVE';

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <AdminBackLink href={`/admin/companies/${companyId}/routes`} label="Semua rute" />
          <h1>{detail.route.name}</h1>
          <p>{detail.stops.map(s => s.name).join(' → ')}</p>
        </div>
        <div className="dash-hero-actions">
          <span className={`admin-status-pill ${active ? 'is-ok' : 'is-neutral'}`}>
            {active ? 'Aktif' : 'Nonaktif'}
          </span>
        </div>
      </header>

      {query?.saved === '1' && (
        <p className="admin-flash-ok" role="status">
          Rute baru berhasil disimpan. Atur tarif per kelas layanan di bagian bawah jika siap.
        </p>
      )}

      <section className="dash-card admin-panel-modern">
        <div className="admin-panel-head">
          <h2>Informasi &amp; urutan stop</h2>
        </div>
        <RouteEditor
          companyId={companyId}
          choices={detail.choices}
          route={detail.route}
          initialStops={detail.stops}
        />
      </section>

      <section className="dash-card admin-panel-modern">
        <div className="admin-panel-head">
          <h2>Preview harga perjalanan</h2>
        </div>
        <QuotePreview
          key={detail.route.revision}
          companyId={companyId}
          routeId={routeId}
          stops={detail.stops}
          classes={detail.classes}
        />
      </section>

      <section className="dash-card admin-panel-modern">
        <div className="admin-panel-head">
          <h2>Tarif per kelas</h2>
        </div>
        <p className="admin-hint">
          Harga rupiah per segmen. Masukkan 0 bila segmen gratis; isian kosong berarti belum
          dikonfigurasi.
        </p>
        {detail.classes.length ? (
          detail.classes.map((c, i) => (
            <div className="admin-class-fare" key={c.id}>
              <h3>
                {c.name} {c.status === 'INACTIVE' ? '· Nonaktif' : ''}
              </h3>
              <FareEditor
                key={c.id + '-' + detail.stops.map(s => s.id).join(',')}
                companyId={companyId}
                route={detail.route}
                stops={detail.stops}
                classId={c.id}
                className={c.name}
                initial={fares[i]}
              />
            </div>
          ))
        ) : (
          <Link href={`/admin/companies/${companyId}/service-classes`} className="dash-link">
            Tambah kelas layanan terlebih dahulu →
          </Link>
        )}
      </section>
    </div>
  );
}
