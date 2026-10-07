import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fleetData } from '../../../../fleet-data';
import SeatTemplateBuilder from '../../../../components/seat-template-builder';
export default async function Page({ params }: { params: Promise<{ companyId: string; templateId: string }> }) {
  const { companyId, templateId } = await params, { context, templates } = await fleetData(companyId);
  let detail; try { detail = await templates.detail(context, templateId); } catch { notFound(); }
  return <><header className="admin-header"><Link href={`/admin/companies/${companyId}/seat-templates`}>← Template kursi</Link><h1>{detail.name}</h1></header><section className="admin-panel"><SeatTemplateBuilder key={detail.id} companyId={companyId} initial={detail}/></section></>;
}
