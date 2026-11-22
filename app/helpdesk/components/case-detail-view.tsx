import { Info } from '@phosphor-icons/react/dist/ssr/Info';
import AttachmentList from './attachment-list';
import CaseActions, { RetryMail } from './case-actions';
import {
  statusLabels,
  priorityLabels,
  categoryLabels,
  type ComplaintStatus,
  type Category,
  type Priority,
} from '@/modules/helpdesk/types';
import type { createHelpdeskStaff } from '@/modules/helpdesk/staff';

type Detail = NonNullable<Awaited<ReturnType<ReturnType<typeof createHelpdeskStaff>['detail']>>>;

const eventLabels: Record<string, string> = {
  SUBMITTED: 'Laporan diterima',
  SUPPLEMENTED: 'Informasi tambahan dari pelapor',
  PRIORITY: 'Prioritas diperbarui',
  DIPROSES: 'Mulai diproses',
  PERLU_DILENGKAPI: 'Meminta kelengkapan',
  SELESAI: 'Laporan selesai',
};

const mailLabels: Record<string, string> = {
  QUEUED: 'Menunggu pengiriman',
  SENDING: 'Sedang dikirim',
  ACCEPTED: 'Diterima penyedia email',
  FAILED: 'Gagal dikirim',
  UNKNOWN: 'Hasil pengiriman belum diketahui',
};

const mailTone: Record<string, string> = {
  QUEUED: 'is-warn',
  SENDING: 'is-info',
  ACCEPTED: 'is-ok',
  FAILED: 'is-danger',
  UNKNOWN: 'is-neutral',
};

const statusTone: Record<ComplaintStatus, string> = {
  MENUNGGU: 'is-warn',
  DIPROSES: 'is-info',
  PERLU_DILENGKAPI: 'is-purple',
  SELESAI: 'is-ok',
};

const priorityTone: Record<Priority, string> = {
  HIGH: 'is-danger',
  MEDIUM: 'is-warn',
  LOW: 'is-neutral',
};

const eventTone: Record<string, string> = {
  SUBMITTED: 'is-neutral',
  SUPPLEMENTED: 'is-info',
  PRIORITY: 'is-warn',
  DIPROSES: 'is-info',
  PERLU_DILENGKAPI: 'is-purple',
  SELESAI: 'is-ok',
};

function formatWibDateTime(value: Date | string): string {
  return `${new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))} WIB`;
}

export default function CaseDetailView({
  id,
  data,
  readOnly = false,
}: {
  id: string;
  data: Detail;
  readOnly?: boolean;
  backHref?: string;
  embedded?: boolean;
}) {
  const { row, events, files, jobs, writable } = data;
  const canWrite = writable && !readOnly;
  const statusKey = row.status as ComplaintStatus;
  const priorityKey = row.priority as Priority | null;

  return (
    <>
      <section className="dash-card admin-panel-modern hd-detail-summary">
        <div className="hd-detail-summary-top">
          <div>
            <span className="hd-code-pill">{String(row.code)}</span>
            <h2>{String(row.title)}</h2>
          </div>
          <div className="fleet-meta-strip">
            <span className={`admin-status-pill ${statusTone[statusKey] ?? 'is-neutral'}`}>
              {statusLabels[statusKey]}
            </span>
            <span className="admin-status-pill is-neutral">
              {categoryLabels[row.category as Category] ?? String(row.category)}
            </span>
            {priorityKey ? (
              <span className={`admin-status-pill ${priorityTone[priorityKey] ?? 'is-neutral'}`}>
                {priorityLabels[priorityKey]}
              </span>
            ) : (
              <span className="admin-status-pill is-neutral">Prioritas belum ditentukan</span>
            )}
          </div>
        </div>
        {readOnly && (
          <div className="admin-callout-info">
            <Info size={18} weight="duotone" aria-hidden="true" />
            <span>
              Mode pemantauan Admin. Hanya Petugas Helpdesk yang dapat mengubah status atau
              prioritas laporan.
            </span>
          </div>
        )}
      </section>

      <div className="hd-detail-grid">
        <div className="hd-detail-primary">
          <section className="dash-card admin-panel-modern hd-section-card">
            <h2>Informasi pelapor</h2>
            <dl className="payment-conflict-details hd-detail-facts">
              <div>
                <dt>Nama</dt>
                <dd>{String(row.name)}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>
                  <a href={`mailto:${String(row.email)}`}>{String(row.email)}</a>
                </dd>
              </div>
              {row.booking_reference && (
                <div>
                  <dt>Referensi pesanan</dt>
                  <dd>
                    <span>{String(row.booking_reference)}</span>
                    <small className="hd-fact-note">Isian pelapor, belum diverifikasi</small>
                  </dd>
                </div>
              )}
            </dl>
            <h2>Uraian laporan</h2>
            <p className="hd-staff-note">{String(row.description)}</p>
            <h3>Lampiran privat</h3>
            <AttachmentList
              files={files.map(file => ({
                id: String(file.id),
                name: String(file.name),
                mime: String(file.mime),
                size: Number(file.size),
              }))}
            />
          </section>

          <section className="dash-card admin-panel-modern hd-section-card">
            <h2>Riwayat penanganan</h2>
            {events.length ? (
              <ol className="hd-timeline">
                {events.map(event => (
                  <li key={String(event.id)} className={eventTone[String(event.kind)] ?? 'is-neutral'}>
                    <div className="hd-timeline-head">
                      <strong>{eventLabels[String(event.kind)] || String(event.kind)}</strong>
                      <small>{formatWibDateTime(event.created_at)}</small>
                    </div>
                    {event.note && (
                      <p className="hd-staff-note hd-timeline-note">{String(event.note)}</p>
                    )}
                  </li>
                ))}
              </ol>
            ) : (
              <p className="hd-muted-label">Belum ada riwayat.</p>
            )}
          </section>
        </div>

        <aside className="hd-detail-side">
          {canWrite ? (
            <CaseActions
              id={id}
              revision={Number(row.revision)}
              status={statusKey}
              priority={priorityKey}
            />
          ) : (
            <section className="dash-card admin-panel-modern hd-section-card">
              <h2>Status penanganan</h2>
              <div className="fleet-meta-strip">
                <span className={`admin-status-pill ${statusTone[statusKey] ?? 'is-neutral'}`}>
                  {statusLabels[statusKey]}
                </span>
                {priorityKey ? (
                  <span className={`admin-status-pill ${priorityTone[priorityKey] ?? 'is-neutral'}`}>
                    {priorityLabels[priorityKey]}
                  </span>
                ) : (
                  <span className="admin-status-pill is-neutral">Prioritas belum ditentukan</span>
                )}
              </div>
              {row.status === 'SELESAI' && (
                <p className="hd-muted-label hd-status-note">
                  Laporan selesai dan tidak dapat diubah.
                </p>
              )}
            </section>
          )}

          <section className="dash-card admin-panel-modern hd-section-card">
            <h2>Notifikasi email</h2>
            <p className="hd-muted-label hd-mail-disclaimer">
              Status diterima penyedia email tidak menjamin email sudah masuk kotak masuk pelapor.
            </p>
            {jobs.length ? (
              <ul className="hd-mail-job-list">
                {jobs.map(job => {
                  const stateKey = String(job.state);
                  const errorHint =
                    job.error_code === 'configuration'
                      ? 'Konfigurasi email belum lengkap'
                      : job.error_code === 'superseded'
                        ? 'Permintaan kelengkapan sudah ditindaklanjuti atau diganti'
                        : '';
                  return (
                    <li key={String(job.id)} className="hd-mail-job-row">
                      <div className="hd-mail-job-meta">
                        <span className={`admin-status-pill ${mailTone[stateKey] ?? 'is-neutral'}`}>
                          {mailLabels[stateKey] || stateKey}
                        </span>
                        {errorHint && (
                          <p className="hd-muted-label hd-mail-job-hint">{errorHint}</p>
                        )}
                      </div>
                      {canWrite &&
                        job.state === 'FAILED' &&
                        ['configuration', 'rejected', 'temporary'].includes(
                          String(job.error_code),
                        ) && <RetryMail jobId={String(job.id)} />}
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="hd-muted-label">Belum ada email untuk laporan ini.</p>
            )}
          </section>
        </aside>
      </div>
    </>
  );
}
