'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { TemplateDetail, VehicleDetail, VehicleStatus } from '@/modules/fleet/types';
import { resolveConflict } from '@/modules/fleet/conflict';
import { runFleetAction } from '../fleet-actions';
import ConflictPanel from './conflict-panel';
export default function VehicleForm({ companyId, initial, templates, classes }: { companyId: string; initial?: VehicleDetail; templates: TemplateDetail[]; classes: { id: string; name: string; status: 'ACTIVE' | 'INACTIVE' }[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<VehicleDetail>(initial ?? { id: '', revision: 0, name: '', plateNumber: '', fleetNumber: null, seatTemplateId: '', defaultServiceClassId: '', status: 'ACTIVE', capacity: 0, templateStatus: 'ACTIVE', classStatus: 'ACTIVE' });
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [conflict, setConflict] = useState(false), [latest, setLatest] = useState<VehicleDetail | null>(null);
  const templateChoices = templates.filter(t => t.status === 'ACTIVE' || t.id === initial?.seatTemplateId);
  const classChoices = classes.filter(c => c.status === 'ACTIVE' || c.id === initial?.defaultServiceClassId);
  async function save() {
    if (busy) return; setBusy(true); setMessage('');
    try {
      const { name, plateNumber, fleetNumber, seatTemplateId, defaultServiceClassId, status } = draft;
      const result = await runFleetAction(companyId, { kind: 'saveVehicle', id: draft.id || undefined, revision: draft.revision || undefined, input: { name, plateNumber, fleetNumber, seatTemplateId, defaultServiceClassId, status } });
      if (!result.ok) { setMessage(result.message); if (result.code === 'conflict') { setConflict(true); setLatest(null); } return; }
      setDraft({ ...draft, id: result.vehicleId!, revision: result.revision! }); setConflict(false); setLatest(null); setMessage('Armada tersimpan.');
      if (!draft.id) router.push(`/admin/companies/${companyId}/vehicles/${result.vehicleId}`);
      router.refresh();
    } finally { setBusy(false); }
  }
  async function refresh() {
    setBusy(true);
    try { const result = await runFleetAction(companyId, { kind: 'refreshVehicle', id: draft.id }); if (result.ok && result.latestVehicle) setLatest(result.latestVehicle); else if (!result.ok) setMessage(result.message); } finally { setBusy(false); }
  }
  function choose(choice: 'adopt' | 'overwrite') { if (!latest) return; setDraft(resolveConflict(draft, latest, choice, choice === 'overwrite')); setConflict(false); setLatest(null); setMessage('Pilihan diterapkan. Periksa form sebelum menyimpan.'); }
  return <form className="admin-form" onSubmit={e => { e.preventDefault(); void save(); }}><fieldset disabled={busy} className="fleet-fieldset"><label>Nama armada<input required maxLength={120} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/></label><label>Plat nomor<input required maxLength={24} value={draft.plateNumber} onChange={e => setDraft({ ...draft, plateNumber: e.target.value })}/></label><label>Nomor armada opsional<input maxLength={32} value={draft.fleetNumber ?? ''} onChange={e => setDraft({ ...draft, fleetNumber: e.target.value || null })}/></label><label>Template kursi<select required value={draft.seatTemplateId} onChange={e => setDraft({ ...draft, seatTemplateId: e.target.value })}><option value="">Pilih template</option>{templateChoices.map(t => <option key={t.id} value={t.id}>{t.name} · {t.capacity} kursi{t.status === 'ARCHIVED' ? ' · Diarsipkan (referensi lama)' : ''}</option>)}</select></label><label>Kelas layanan default<select required value={draft.defaultServiceClassId} onChange={e => setDraft({ ...draft, defaultServiceClassId: e.target.value })}><option value="">Pilih kelas</option>{classChoices.map(c => <option key={c.id} value={c.id}>{c.name}{c.status === 'INACTIVE' ? ' · Nonaktif (referensi lama)' : ''}</option>)}</select></label><label>Status armada<select value={draft.status} onChange={e => setDraft({ ...draft, status: e.target.value as VehicleStatus })}>{['ACTIVE', 'MAINTENANCE', 'INACTIVE'].map(status => <option key={status}>{status}</option>)}</select></label><p className="admin-hint">{templates.find(t => t.id === draft.seatTemplateId)?.capacity ?? 0} kursi dari template saat ini · revisi {draft.revision || 'baru'}</p><button disabled={conflict} type="submit">{busy ? 'Menyimpan…' : 'Simpan armada'}</button>{conflict && <ConflictPanel latest={latest} onRefresh={() => void refresh()} onAdopt={() => choose('adopt')} onOverwrite={() => choose('overwrite')}/>}</fieldset><p role="status" aria-live="polite">{message}</p></form>;
}
