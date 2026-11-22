import { notFound, unstable_rethrow } from 'next/navigation';
import AdminBackLink from '@/app/admin/components/admin-back-link';
import { helpdeskContext } from '../data';
import CaseDetailView from '../components/case-detail-view';

export default async function CaseDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let data:
    | Awaited<ReturnType<Awaited<ReturnType<typeof helpdeskContext>>['staff']['detail']>>
    | undefined;
  let unavailable = false;
  try {
    const { ctx, staff } = await helpdeskContext();
    data = await staff.detail(ctx, id);
  } catch (error) {
    unstable_rethrow(error);
    unavailable = true;
  }

  if (unavailable) {
    return (
      <div className="dash-root">
        <section className="dash-card admin-panel-modern hd-alert-card" role="alert">
          <AdminBackLink href="/helpdesk/pengaduan" label="Kembali ke pengaduan" />
          <h1>Laporan tidak ditemukan</h1>
          <p>Periksa kembali tautan laporan atau muat ulang halaman.</p>
        </section>
      </div>
    );
  }

  if (!data) notFound();

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <AdminBackLink href="/helpdesk/pengaduan" label="Kembali ke pengaduan" />
          <h1>Detail pengaduan</h1>
          <p>Tinjau detail laporan, perbarui prioritas, dan catat hasil penanganan.</p>
        </div>
      </header>

      <CaseDetailView id={id} data={data} />
    </div>
  );
}
