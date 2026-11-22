import Link from 'next/link';
import { Clock, Funnel, ListBullets } from '@phosphor-icons/react/ssr';
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
        <section className="dash-card admin-panel-modern" role="alert">
          <h1>Pengaduan belum tersedia</h1>
          <p className="admin-hint">
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

  const activeFilters = [query.search, query.status, query.priority].filter(Boolean).length;

  return (
    <div className="dash-root hd hd-admin-monitor">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <h1>Pengaduan pelanggan</h1>
          <p>
            Pantau laporan penumpang secara real-time dalam mode baca. Penanganan dilakukan oleh
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

      <div className="admin-stat-grid" role="region" aria-label="Ringkasan pengaduan pelanggan">
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-amber" aria-hidden="true">
            <Clock size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{data.count}</strong>
            <span className="admin-stat-label">Laporan belum selesai</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-blue" aria-hidden="true">
            <ListBullets size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{data.rows.length}</strong>
            <span className="admin-stat-label">Ditampilkan di halaman ini</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-slate" aria-hidden="true">
            <Funnel size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{activeFilters || 'Semua'}</strong>
            <span className="admin-stat-label">
              {activeFilters ? 'Filter aktif' : 'Filter laporan'}
            </span>
          </div>
        </div>
      </div>

      <CaseList
        embedded
        data={data}
        query={query}
        base={`/admin/companies/${companyId}/helpdesk`}
        detailBase={`/admin/companies/${companyId}/helpdesk`}
      />
    </div>
  );
}
