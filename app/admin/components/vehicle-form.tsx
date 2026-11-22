'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TemplateDetail, VehicleDetail, VehicleStatus } from '@/modules/fleet/types';
import { resolveConflict } from '@/modules/fleet/conflict';
import { runFleetAction } from '../fleet-actions';
import ConflictPanel from './conflict-panel';
import {sourceStatusPresentation} from '../presentation';
import AdminSelect from './admin-select';
import {queueAdminToast} from '../admin-toast';
export default function VehicleForm({ companyId, initial, templates, classes }: { companyId: string; initial?: VehicleDetail; templates: TemplateDetail[]; classes: { id: string; name: string; status: 'ACTIVE' | 'INACTIVE' }[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<VehicleDetail>(initial ?? { id: '', revision: 0, name: '', plateNumber: '', fleetNumber: null, seatTemplateId: '', defaultServiceClassId: '', status: 'ACTIVE', capacity: 0, templateStatus: 'ACTIVE', classStatus: 'ACTIVE' });
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [messageTone, setMessageTone] = useState<'ok' | 'error'>('ok'), [conflict, setConflict] = useState(false), [latest, setLatest] = useState<VehicleDetail | null>(null);
  const templateChoices = templates.filter(t => t.status === 'ACTIVE' || t.id === initial?.seatTemplateId);
  const classChoices = classes.filter(c => c.status === 'ACTIVE' || c.id === initial?.defaultServiceClassId);
  const canDelete = Boolean(draft.id) && draft.tripCount === 0;
  function showError(text: string, isConflict = false) {
    setMessageTone('error');
    setMessage(text);
    queueAdminToast({ title: isConflict ? 'Konflik revisi armada' : 'Armada belum tersimpan', message: text, tone: 'error' });
  }
  async function save() {
    if (busy) return; setBusy(true); setMessage('');
    try {
      const { name, plateNumber, fleetNumber, seatTemplateId, defaultServiceClassId, status } = draft;
      const isCreate = !draft.id;
      const trimmedName = name.trim();
      const result = await runFleetAction(companyId, { kind: 'saveVehicle', id: draft.id || undefined, revision: draft.revision || undefined, input: { name, plateNumber, fleetNumber, seatTemplateId, defaultServiceClassId, status } });
      if (!result.ok) { showError(result.message, result.code === 'conflict'); if (result.code === 'conflict') { setConflict(true); setLatest(null); } return; }
      setDraft({ ...draft, id: result.vehicleId!, revision: result.revision! }); setConflict(false); setLatest(null);
      queueAdminToast({
        title: isCreate ? 'Armada baru ditambahkan' : 'Perubahan armada tersimpan',
        message: isCreate ? `${trimmedName} kini tampil di daftar armada.` : `${trimmedName} telah diperbarui.`,
        tone: 'ok',
        highlightId: result.vehicleId ?? draft.id,
        highlightName: trimmedName,
      });
      router.push(`/admin/companies/${companyId}/vehicles`);
      router.refresh();
    } catch { showError('Koneksi terputus. Coba lagi.'); } finally { setBusy(false); }
  }
  async function removeVehicle() {
    if (busy || !draft.id) return;
    if (!window.confirm('Hapus armada ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) return;
    setBusy(true); setMessage('');
    try {
      const result = await runFleetAction(companyId, { kind: 'deleteVehicle', id: draft.id, revision: draft.revision });
      if (!result.ok) { showError(result.message, result.code === 'conflict'); if (result.code === 'conflict') { setConflict(true); setLatest(null); } return; }
      queueAdminToast({ title: 'Armada dihapus permanen', message: `${draft.name.trim()} telah dihapus dari daftar armada.`, tone: 'ok' });
      router.push(`/admin/companies/${companyId}/vehicles`);
      router.refresh();
    } catch { showError('Koneksi terputus. Coba lagi.'); } finally { setBusy(false); }
  }
  async function refresh() {
    setBusy(true);
    try { const result = await runFleetAction(companyId, { kind: 'refreshVehicle', id: draft.id }); if (result.ok && result.latestVehicle) setLatest(result.latestVehicle); else if (!result.ok) showError(result.message); } catch { showError('Koneksi terputus. Coba lagi.'); } finally { setBusy(false); }
  }
  function choose(choice: 'adopt' | 'overwrite') { if (!latest) return; setDraft(resolveConflict(draft, latest, choice, choice === 'overwrite')); setConflict(false); setLatest(null); setMessageTone('ok'); setMessage('Pilihan diterapkan. Periksa form sebelum menyimpan.'); }
  return <form className="admin-form" onSubmit={e => { e.preventDefault(); void save(); }}><fieldset disabled={busy} className="fleet-fieldset"><div className="admin-fields trip-fields-2col"><label>Nama armada<input required maxLength={120} placeholder="Contoh: HiAce Executive 01" value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/></label><label>Plat nomor<input required maxLength={24} placeholder="Contoh: B 1234 XYZ" value={draft.plateNumber} onChange={e => setDraft({ ...draft, plateNumber: e.target.value })}/></label><label><span className="admin-label-row">Nomor armada <small>(opsional)</small></span><input maxLength={32} placeholder="Contoh: ARM-01" value={draft.fleetNumber ?? ''} onChange={e => setDraft({ ...draft, fleetNumber: e.target.value || null })}/></label><label>Status armada<AdminSelect value={draft.status} onChange={next => setDraft({ ...draft, status: next as VehicleStatus })} options={(['ACTIVE', 'MAINTENANCE', 'INACTIVE'] as const).map(status => ({ value: status, label: sourceStatusPresentation(status).label }))}/></label><label>Template kursi<AdminSelect required placeholder="Pilih template" value={draft.seatTemplateId} onChange={next => setDraft({ ...draft, seatTemplateId: next })} options={templateChoices.map(t => ({ value: t.id, label: `${t.name} · ${t.capacity} kursi${t.status === 'ARCHIVED' ? ' · Diarsipkan (referensi lama)' : ''}` }))}/></label><label>Kelas layanan default<AdminSelect required placeholder="Pilih kelas" value={draft.defaultServiceClassId} onChange={next => setDraft({ ...draft, defaultServiceClassId: next })} options={classChoices.map(c => ({ value: c.id, label: `${c.name}${c.status === 'INACTIVE' ? ' · Nonaktif (referensi lama)' : ''}` }))}/></label></div><div className="admin-form-footer"><div className="fleet-meta-strip"><span className="fleet-meta-chip">{templates.find(t => t.id === draft.seatTemplateId)?.capacity ?? 0} kursi</span>{!draft.id && <span className="fleet-meta-chip">Armada baru</span>}</div><div className="admin-buttons">{canDelete && <button className="admin-danger" disabled={conflict} type="button" onClick={() => void removeVehicle()}>Hapus permanen</button>}<button className="admin-primary" disabled={conflict} type="submit">{busy ? 'Menyimpan…' : 'Simpan armada'}</button></div></div>{draft.id && typeof draft.tripCount === 'number' && draft.tripCount > 0 && <p className="admin-hint">Terhubung ke {draft.tripCount} perjalanan — ubah status menjadi Nonaktif jika armada tidak lagi beroperasi.</p>}{conflict && <ConflictPanel latest={latest} onRefresh={() => void refresh()} onAdopt={() => choose('adopt')} onOverwrite={() => choose('overwrite')}/>}</fieldset>{message && <p className={messageTone === 'error' ? 'admin-flash-error' : 'admin-flash-ok'} role={messageTone === 'error' ? 'alert' : 'status'} aria-live="polite">{message}</p>}</form>;
}
