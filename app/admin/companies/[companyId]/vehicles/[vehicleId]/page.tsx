import { notFound } from 'next/navigation';
import AdminBackLink from '@/app/admin/components/admin-back-link';
import { sourceStatusPresentation } from '@/app/admin/presentation';
import { fleetData } from '../../../../fleet-data';
import VehicleForm from '../../../../components/vehicle-form';

export default async function Page({
  params,
}: {
  params: Promise<{ companyId: string; vehicleId: string }>;
}) {
  const { companyId, vehicleId } = await params;
  const { context, vehicles, templates, data } = await fleetData(companyId);
  let detail;
  try {
    detail = await vehicles.detail(context, vehicleId);
  } catch {
    notFound();
  }
  const status = sourceStatusPresentation(detail.status);

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <AdminBackLink href={`/admin/companies/${companyId}/vehicles`} label="Armada" />
          <h1>{detail.name}</h1>
          <p>
            {detail.plateNumber} · {detail.capacity} kursi
          </p>
        </div>
        <div className="dash-hero-actions">
          <span className={`admin-status-pill is-${status.tone}`}>{status.label}</span>
        </div>
      </header>

      <section className="dash-card admin-panel-modern">
        <VehicleForm
          key={detail.id}
          companyId={companyId}
          initial={detail}
          templates={await templates.list(context)}
          classes={data.classes}
        />
      </section>
    </div>
  );
}
