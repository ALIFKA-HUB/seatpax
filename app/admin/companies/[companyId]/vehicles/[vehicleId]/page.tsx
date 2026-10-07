import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fleetData } from '../../../../fleet-data';
import VehicleForm from '../../../../components/vehicle-form';
export default async function Page({ params }: { params: Promise<{ companyId: string; vehicleId: string }> }) {
  const { companyId, vehicleId } = await params, { context, vehicles, templates, data } = await fleetData(companyId);
  let detail; try { detail = await vehicles.detail(context, vehicleId); } catch { notFound(); }
  return <><header className="admin-header"><Link href={`/admin/companies/${companyId}/vehicles`}>← Armada</Link><h1>{detail.name}</h1></header><section className="admin-panel"><VehicleForm key={detail.id} companyId={companyId} initial={detail} templates={await templates.list(context)} classes={data.classes}/></section></>;
}
