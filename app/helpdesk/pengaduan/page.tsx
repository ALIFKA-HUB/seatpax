import { unstable_rethrow } from 'next/navigation';
import { ChatCircleText } from '@phosphor-icons/react/dist/ssr/ChatCircleText';
import { Clock } from '@phosphor-icons/react/dist/ssr/Clock';
import { WarningCircle } from '@phosphor-icons/react/dist/ssr/WarningCircle';
import { normalizeHelpdeskPage, type HelpdeskDashboardData } from '@/modules/helpdesk/staff';
import { helpdeskContext } from '../data';
import CaseList from '../components/case-list';

export default async function HelpdeskCases({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; status?: string; priority?: string; page?: string }>;
}) {
  const query = await searchParams;
  let data:
    | Awaited<ReturnType<Awaited<ReturnType<typeof helpdeskContext>>['staff']['list']>>
    | undefined;
  let dashboard: HelpdeskDashboardData | undefined;
  let unavailable = false;
  try {
    const { ctx, staff } = await helpdeskContext();
    [data, dashboard] = await Promise.all([
      staff.list(ctx, { ...query, page: normalizeHelpdeskPage(query.page) }),
      staff.dashboard(ctx),
    ]);
  } catch (error) {
    unstable_rethrow(error);
    unavailable = true;
  }

  if (unavailable || !data || !dashboard) {
    return (
      <div className="dash-root">
        <section className="dash-card admin-panel-modern hd-alert-card" role="alert">
          <h1>Daftar pengaduan belum tersedia</h1>
          <p>Periksa akses dan coba muat ulang halaman.</p>
        </section>
      </div>
    );
  }

  const statItems = [
    {
      count: dashboard.counts.MENUNGGU,
      label: 'Menunggu pemeriksaan',
      tone: 'is-amber',
      Icon: Clock,
    },
    {
      count: dashboard.counts.DIPROSES,
      label: 'Sedang diproses',
      tone: 'is-blue',
      Icon: ChatCircleText,
    },
    {
      count: dashboard.counts.PERLU_DILENGKAPI,
      label: 'Perlu dilengkapi',
      tone: 'is-indigo',
      Icon: WarningCircle,
    },
  ];

  return (
    <div className="dash-root">
      <header className="dash-hero">
        <div className="dash-hero-copy">
          <h1>Pengaduan pelanggan</h1>
          <p>
            {data.count} laporan belum selesai. Periksa laporan, tentukan prioritas, dan catat
            tindak lanjut penanganan.
          </p>
        </div>
      </header>

      <div className="admin-stat-grid" role="region" aria-label="Ringkasan pengaduan pelanggan">
        {statItems.map(({ count, label, tone, Icon }) => (
          <div key={label} className="admin-stat-card">
            <span className={`dash-icon-badge ${tone}`} aria-hidden="true">
              <Icon size={20} weight="duotone" />
            </span>
            <div className="admin-stat-meta">
              <strong className="admin-stat-value">{count}</strong>
              <span className="admin-stat-label">{label}</span>
            </div>
          </div>
        ))}
      </div>

      <CaseList data={data} query={query} statusCounts={dashboard.counts} />
    </div>
  );
}
