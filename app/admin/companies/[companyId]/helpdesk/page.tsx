import Link from 'next/link';
import { IconArrowRight } from '@/app/admin/components/admin-back-link';
import { helpdeskContext } from '@/app/helpdesk/data';
import CaseList from '@/app/helpdesk/components/case-list';
import '@/app/pengaduan/pengaduan.css';
import '@/app/helpdesk/helpdesk.css';
import { normalizeHelpdeskPage } from '@/modules/helpdesk/staff';

export default async function AdminComplaints({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ search?: string; status?: string; priority?: string; page?: string }>;
}) {
  const { companyId } = await params;
  const query = await searchParams;
  let data;
  try {
    const { ctx, staff } = await helpdeskContext();
    if (ctx.companyId !== companyId) throw new Error();
    data = await staff.list(ctx, { ...query, page: normalizeHelpdeskPage(query.page) });
  } catch {}

  if (!data) {
    return (
      <div className="dash-root hd hd-admin-monitor">
        <section className="dash-card hd-panel" role="alert">
          <h1>Pengaduan belum tersedia</h1>
          <p>
            Pengaduan belum dikonfigurasi untuk perusahaan ini atau Anda belum memiliki akses
            pemantauan.
          </p>
          <Link className="dash-outline-cta" href={`/admin/companies/${companyId}`}>
            ← Kembali ke dashboard perusahaan
          </Link>
        </section>
      </div>
    );
  }

  return (
    <div className="dash-root hd hd-admin-monitor">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <h1>Pengaduan pelanggan</h1>
          <p>
            Admin perusahaan memantau pengaduan dalam mode baca. Pengelolaan status dilakukan oleh
            petugas Helpdesk.
          </p>
        </div>
        <div className="dash-hero-actions">
          <Link className="dash-outline-cta" href={`/admin/companies/${companyId}/helpdesk-staff`}>
            <span>Kelola petugas Helpdesk</span>
            <IconArrowRight size={14} />
          </Link>
        </div>
      </header>

      <CaseList
        data={data}
        query={query}
        base={`/admin/companies/${companyId}/helpdesk`}
        detailBase={`/admin/companies/${companyId}/helpdesk`}
      />
    </div>
  );
}
