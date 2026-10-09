'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { capacity, emptyGrid, renumber, resize, setCell } from '@/modules/fleet/grid';
import { cellTypes, type TemplateDetail, type CellType } from '@/modules/fleet/types';
import { resolveConflict } from '@/modules/fleet/conflict';
import { runFleetAction } from '../fleet-actions';
import SeatGrid from './seat-grid';
import {sourceStatusPresentation} from '../presentation';
import ConflictPanel from './conflict-panel';
export default function SeatTemplateBuilder({ companyId, initial }: { companyId: string; initial?: TemplateDetail }) {
  const router = useRouter();
  const [draft, setDraft] = useState<TemplateDetail>(initial ?? { ...emptyGrid(4, 5), name: '', id: '', version: 0, status: 'ACTIVE', capacity: 0 });
  const [rows, setRows] = useState(draft.rows), [cols, setCols] = useState(draft.cols);
  const [selected, select] = useState('0:0'), [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [conflict, setConflict] = useState(false), [latest, setLatest] = useState<TemplateDetail | null>(null);
  const cell = draft.cells.find(c => `${c.rowIndex}:${c.colIndex}` === selected) ?? draft.cells[0];
  const updateCell = (type: CellType, label = cell.label, code?: string | null) => setDraft({ ...draft, ...setCell(draft, cell.rowIndex, cell.colIndex, type, label, code) });
  async function persist(status?: 'ACTIVE' | 'ARCHIVED') {
    if (busy) return; setBusy(true); setMessage('');
    try {
      const result = await runFleetAction(companyId, status ? { kind: 'templateStatus', id: draft.id, version: draft.version, status } : { kind: 'saveTemplate', id: draft.id || undefined, version: draft.version || undefined, input: { name: draft.name, rows: draft.rows, cols: draft.cols, cells: draft.cells } });
      if (!result.ok) { setMessage(result.message); if (result.code === 'conflict') { setConflict(true); setLatest(null); } return; }
      setConflict(false); setLatest(null); setDraft({ ...draft, id: result.templateId!, version: result.version!, status: status ?? draft.status }); setMessage('Template tersimpan.');
      if (!draft.id) router.push(`/admin/companies/${companyId}/seat-templates/${result.templateId}`);
      router.refresh();
    } finally { setBusy(false); }
  }
  async function refresh() {
    setBusy(true);
    try { const result = await runFleetAction(companyId, { kind: 'refreshTemplate', id: draft.id }); if (result.ok && result.latestTemplate) setLatest(result.latestTemplate); else if (!result.ok) setMessage(result.message); } finally { setBusy(false); }
  }
  function choose(choice: 'adopt' | 'overwrite') {
    if (!latest) return;
    const next = resolveConflict(draft, latest, choice, choice === 'overwrite'); setDraft(next);
    if (choice === 'adopt') { setRows(next.rows); setCols(next.cols); select('0:0'); }
    setConflict(false); setLatest(null); setMessage('Pilihan diterapkan. Periksa form sebelum menyimpan.');
  }
  return <form className="admin-form" onSubmit={e => { e.preventDefault(); void persist(); }}><fieldset disabled={busy} className="fleet-fieldset"><label>Nama template<input required maxLength={120} value={draft.name} onChange={e => setDraft({ ...draft, name: e.target.value })}/></label><div className="fleet-dimensions"><label>Baris<input type="number" min={1} max={30} value={rows} onChange={e => setRows(Number(e.target.value))}/></label><label>Kolom<input type="number" min={1} max={8} value={cols} onChange={e => setCols(Number(e.target.value))}/></label><button type="button" onClick={() => {
    try { const result = resize(draft, rows, cols); if (result.removesContent && !window.confirm('Ukuran ini akan menghapus sel berisi di luar grid. Lanjutkan?')) return; setDraft({ ...draft, ...result.layout }); select('0:0'); setMessage(''); } catch { setMessage('Gunakan 1–30 baris dan 1–8 kolom.'); }
  }}>Terapkan ukuran</button></div><p className="admin-hint">{capacity(draft)} kursi · {sourceStatusPresentation(draft.status).label} · versi {draft.version || 'baru'}. Kapasitas dihitung ulang saat disimpan.</p><div className="fleet-builder"><SeatGrid layout={draft} selected={selected} onSelect={(row, col) => select(`${row}:${col}`)}/><div><h3>Sel baris {cell.rowIndex + 1}, kolom {cell.colIndex + 1}</h3><label>Jenis sel<select value={cell.type} onChange={e => updateCell(e.target.value as CellType)}>{cellTypes.map(type => <option key={type} value={type}>{({SEAT:"Kursi",DRIVER:"Sopir",AISLE:"Lorong",DOOR:"Pintu",FACILITY:"Fasilitas",EMPTY:"Kosong"})[type]}</option>)}</select></label>{cell.type === 'SEAT' && <label>Kode kursi<input maxLength={8} value={cell.seatCode ?? ''} onChange={e => updateCell(cell.type, cell.label, e.target.value.toUpperCase())}/></label>}<label>Label opsional<input maxLength={40} value={cell.label ?? ''} onChange={e => updateCell(cell.type, e.target.value, cell.seatCode)}/></label><p className="admin-hint">SEAT: kursi · DRIVER: sopir · AISLE: lorong · DOOR: pintu · FACILITY: fasilitas · EMPTY: kosong</p></div></div><div className="admin-buttons"><button type="button" onClick={() => { if (window.confirm('Nomori ulang semua kursi dari 01 menurut baris dan kolom? Kode manual akan diganti.')) setDraft({ ...draft, ...renumber(draft) }); }}>Nomori ulang kursi</button><button className="admin-primary" disabled={conflict} type="submit">{busy ? 'Menyimpan…' : 'Simpan template'}</button>{draft.id && <button className={draft.status === "ACTIVE" ? "admin-danger" : undefined} disabled={conflict} type="button" onClick={() => { const status = draft.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE'; if (window.confirm(status === 'ARCHIVED' ? 'Arsipkan template? Armada lama tetap terhubung.' : 'Aktifkan kembali template?')) void persist(status); }}>{draft.status === 'ACTIVE' ? 'Arsipkan template' : 'Aktifkan template'}</button>}</div>{conflict && <ConflictPanel latest={latest} onRefresh={() => void refresh()} onAdopt={() => choose('adopt')} onOverwrite={() => choose('overwrite')}/>}</fieldset><p role="status" aria-live="polite">{message}</p></form>;
}
