import Link from 'next/link';
import { fleetData } from '../../../fleet-data';
import SeatTemplateBuilder from '../../../components/seat-template-builder';
export default async function Page({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = await params, { context, templates } = await fleetData(companyId), list = await templates.list(context);
  return <><header className="admin-header"><p className="eyebrow">SUMBER DENAH</p><h1>Template kursi</h1><p>Susun denah yang dapat digunakan oleh armada PO Anda.</p></header><section className="admin-panel"><h2>Daftar template</h2>{list.length ? <div className="admin-table-wrap"><table><thead><tr><th>Nama</th><th>Ukuran</th><th>Kapasitas</th><th>Status / versi</th><th>Kelola</th></tr></thead><tbody>{list.map(t => <tr key={t.id}><td>{t.name}</td><td>{t.rows} × {t.cols}</td><td>{t.capacity}</td><td>{t.status} / {t.version}</td><td><Link href={`/admin/companies/${companyId}/seat-templates/${t.id}`}>Buka template →</Link></td></tr>)}</tbody></table></div> : <p>Belum ada template. Pilih sel pada grid di bawah untuk membuat kursi pertama.</p>}</section><section className="admin-panel"><h2>Template baru</h2><SeatTemplateBuilder companyId={companyId}/></section></>;
}
