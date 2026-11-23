'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import AdminSelect, { type AdminSelectOption } from '@/app/admin/components/admin-select';
import { queueAdminToast } from '@/app/admin/admin-toast';
import type { ComplaintStatus, Priority } from '@/modules/helpdesk/types';
import { changeComplaintAction, retryComplaintEmailAction } from '../actions';

const PRIORITY_OPTIONS: AdminSelectOption[] = [
  { value: 'LOW', label: 'Rendah' },
  { value: 'MEDIUM', label: 'Sedang' },
  { value: 'HIGH', label: 'Tinggi' },
];

export async function retryMailWithRefresh(jobId: string, refresh: () => void) {
  const form = new FormData();
  form.set('jobId', jobId);
  const result = await retryComplaintEmailAction(form);
  if (result.ok) refresh();
  return result;
}

export default function CaseActions({
  id,
  revision,
  status,
  priority,
}: {
  id: string;
  revision: number;
  status: ComplaintStatus;
  priority: Priority | null;
}) {
  const [message, setMessage] = useState('');
  const [busy, start] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    form.set('id', id);
    form.set('revision', String(revision));
    setMessage('');
    start(async () => {
      try {
        const r = await changeComplaintAction(form);
        setMessage(r.message);
        queueAdminToast({
          title: r.ok ? 'Pembaruan laporan tersimpan' : 'Gagal menyimpan perubahan',
          message: r.message,
          tone: r.ok ? 'ok' : 'error',
        });
        if (r.ok) router.refresh();
      } catch {
        const fallback = 'Perubahan belum dapat disimpan. Periksa koneksi dan coba lagi.';
        setMessage(fallback);
        queueAdminToast({
          title: 'Gagal menyimpan perubahan',
          message: fallback,
          tone: 'error',
        });
      }
    });
  }

  if (status === 'SELESAI') {
    return (
      <section className="dash-card admin-panel-modern hd-section-card">
        <h2>Tindakan petugas</h2>
        <p className="hd-muted-label hd-status-note">
          Laporan telah selesai dan tidak dapat diubah.
        </p>
      </section>
    );
  }

  const actionOptions: AdminSelectOption[] = [
    ...(status === 'MENUNGGU' ? [{ value: 'DIPROSES', label: 'Mulai proses' }] : []),
    { value: 'PERLU_DILENGKAPI', label: 'Minta kelengkapan' },
    ...(status === 'DIPROSES' ? [{ value: 'SELESAI', label: 'Selesaikan laporan' }] : []),
  ];

  return (
    <section className="dash-card admin-panel-modern hd-section-card">
      <h2>Tindakan petugas</h2>
      <div className="hd-action-forms">
        <form
          key={`${id}:${revision}:priority:${priority ?? ''}`}
          className="admin-form hd-action-form"
          onSubmit={submit}
        >
          <input type="hidden" name="action" value="PRIORITY" />
          <label>
            <span>Prioritas</span>
            <AdminSelect
              name="priority"
              required
              defaultValue={priority || ''}
              placeholder="Pilih prioritas"
              options={PRIORITY_OPTIONS}
              disabled={busy}
            />
          </label>
          <button type="submit" className="admin-secondary-btn" disabled={busy}>
            Simpan prioritas
          </button>
        </form>

        {status !== 'PERLU_DILENGKAPI' && (
          <form
            key={`${id}:status:${status}`}
            className="admin-form hd-action-form"
            onSubmit={submit}
          >
            <label>
              <span>Tindakan</span>
              <AdminSelect
                name="action"
                defaultValue={actionOptions[0].value}
                options={actionOptions}
                disabled={busy}
              />
            </label>
            <label>
              <span>Keterangan</span>
              <textarea
                name="note"
                rows={4}
                maxLength={3000}
                placeholder="Catat ringkasan tindak lanjut atau detail kelengkapan yang diminta..."
              />
              <small>
                Minimal 10 karakter untuk permintaan kelengkapan/penyelesaian. Keterangan ini
                terlihat pada pengecekan publik. Jangan cantumkan data pribadi atau rincian
                finansial.
              </small>
            </label>
            <button type="submit" className="admin-primary" disabled={busy}>
              {busy ? 'Menyimpan…' : 'Simpan tindakan'}
            </button>
          </form>
        )}
      </div>
      {message && (
        <p className="admin-message" role="status">
          {message}
        </p>
      )}
    </section>
  );
}

export function RetryMail({ jobId }: { jobId: string }) {
  const [message, setMessage] = useState('');
  const [busy, start] = useTransition();
  const router = useRouter();

  return (
    <div className="hd-mail-retry">
      <button
        type="button"
        className="admin-secondary-btn"
        disabled={busy}
        onClick={() =>
          start(async () => {
            try {
              const result = await retryMailWithRefresh(jobId, () => router.refresh());
              setMessage(result.message);
              queueAdminToast({
                title: result.ok
                  ? 'Pengiriman ulang email dijadwalkan'
                  : 'Gagal menjadwalkan ulang email',
                message: result.message,
                tone: result.ok ? 'ok' : 'error',
              });
            } catch {
              const fallback = 'Email belum dapat dikirim ulang. Coba beberapa saat lagi.';
              setMessage(fallback);
              queueAdminToast({
                title: 'Gagal menjadwalkan ulang email',
                message: fallback,
                tone: 'error',
              });
            }
          })
        }
      >
        {busy ? 'Mengirim ulang…' : 'Coba kirim ulang'}
      </button>
      {message && (
        <p className="admin-message" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
