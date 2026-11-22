'use client';
import { useState, useTransition } from 'react';
import { manageHelpdeskStaff } from '../helpdesk-actions';
import AdminSelect from './admin-select';

export default function HelpdeskStaffForm() {
  const [message, setMessage] = useState('');
  const [busy, start] = useTransition();

  return (
    <form
      className="admin-form hd-staff-form"
      onSubmit={e => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        start(async () => {
          const r = await manageHelpdeskStaff(f);
          setMessage(r.message);
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
        <p className="admin-message" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
