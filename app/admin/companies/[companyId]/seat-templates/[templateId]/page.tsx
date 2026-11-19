import { notFound } from 'next/navigation';
import AdminBackLink from '@/app/admin/components/admin-back-link';
import { sourceStatusPresentation } from '@/app/admin/presentation';
import { fleetData } from '../../../../fleet-data';
import SeatTemplateBuilder from '../../../../components/seat-template-builder';

export default async function Page({
  params,
}: {
  params: Promise<{ companyId: string; templateId: string }>;
}) {
  const { companyId, templateId } = await params;
  const { context, templates } = await fleetData(companyId);
  let detail;
  try {
    detail = await templates.detail(context, templateId);
  } catch {
    notFound();
  }
  const status = sourceStatusPresentation(detail.status);

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <AdminBackLink
            href={`/admin/companies/${companyId}/seat-templates`}
            label="Template kursi"
          />
          <h1>{detail.name}</h1>
          <p>
            {detail.rows} × {detail.cols} · {detail.capacity} kursi · versi {detail.version}
          </p>
        </div>
        <div className="dash-hero-actions">
          <span className={`admin-status-pill is-${status.tone}`}>{status.label}</span>
        </div>
      </header>

      <section className="dash-card admin-panel-modern">
        <SeatTemplateBuilder key={detail.id} companyId={companyId} initial={detail} />
      </section>
    </div>
  );
}
