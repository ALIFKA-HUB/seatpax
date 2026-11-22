'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { manageHelpdeskStaff } from '../helpdesk-actions';
import AdminSelect from './admin-select';
import { queueAdminToast } from '../admin-toast';

export default function HelpdeskStaffForm() {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, start] = useTransition();

  return (
    <form
      className="admin-form hd-staff-form"
      onSubmit={e => {
        e.preventDefault();
        const form = e.currentTarget;
        const f = new FormData(form);
        const email = String(f.get('email') ?? '').trim().toLowerCase();
        setMessage('');
        start(async () => {
          const r = await manageHelpdeskStaff(f);
          if (r.ok) {
            form.reset();
            queueAdminToast({
              title: 'Akses petugas Helpdesk diperbarui',
              message: email ? `${email} telah diperbarui.` : r.message,
              tone: 'ok',
              highlightName: email || undefined,
            });
            router.refresh();
          } else {
            setMessage(r.message);
            queueAdminToast({
              title: 'Akses petugas belum tersimpan',
              message: r.message,
              tone: 'error',
            });
          }
        });
      }}
    >
      <div className="admin-panel-head">
        <h2>Akses Petugas Helpdesk</h2>
      </div>
      <p className="admin-hint">
        Petugas harus sudah pernah masuk dan memverifikasi email di Seatpax.
      </p>
      <div className="admin-fields trip-fields-2col">
        <label>
          Email akun
          <input name="email" type="email" required maxLength={254} placeholder="petugas@po.id" />
        </label>
        <label>
          Status akses
          <AdminSelect
            name="status"
            defaultValue="ACTIVE"
            options={[
              { value: 'ACTIVE', label: 'Aktif' },
              { value: 'DISABLED', label: 'Nonaktif' },
            ]}
          />
        </label>
      </div>
      <div className="admin-form-footer">
        <span className="admin-hint">Perubahan akses langsung berlaku pada sesi petugas.</span>
        <button className="admin-primary" disabled={busy}>
          {busy ? 'Menyimpan…' : 'Simpan akses'}
        </button>
      </div>
      {message && (
        <p className="admin-flash-error" role="alert">
          {message}
        </p>
      )}
    </form>
  );
}
