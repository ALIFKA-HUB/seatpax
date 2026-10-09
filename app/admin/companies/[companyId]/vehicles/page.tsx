import Link from 'next/link';
import {sourceStatusPresentation} from '@/app/admin/presentation';
import { fleetData } from '../../../fleet-data';
import VehicleForm from '../../../components/vehicle-form';
export default async function Page({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params, { context, vehicles, templates, data } = await fleetData(companyId);
  const list = await vehicles.list(context), choices = await templates.list(context);
  return <><header className="admin-header"><p className="eyebrow">KENDARAAN PO</p><h1>Armada</h1><p>Hubungkan kendaraan dengan template kursi dan kelas layanan default.</p></header><section className="admin-panel"><h2>Daftar armada</h2>{list.length ? <div className="admin-table-wrap" role="region" aria-label="Daftar sumber armada" tabIndex={0}><table><thead><tr><th>Armada</th><th>Plat</th><th>Kursi</th><th>Status / revisi</th><th>Kelola</th></tr></thead><tbody>{list.map(v => <tr key={v.id}><td>{v.name}</td><td>{v.plateNumber}</td><td>{v.capacity}</td><td>{sourceStatusPresentation(v.status).label} / {v.revision}</td><td><Link href={`/admin/companies/${companyId}/vehicles/${v.id}`}>Buka armada →</Link></td></tr>)}</tbody></table></div> : <p>Belum ada armada. Siapkan template aktif dan kelas layanan terlebih dahulu.</p>}</section><section className="admin-panel"><h2>Armada baru</h2><VehicleForm companyId={companyId} templates={choices} classes={data.classes}/></section></>;
}
