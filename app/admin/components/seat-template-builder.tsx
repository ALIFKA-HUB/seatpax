'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { applyCellBrush, capacity, emptyGrid, renumber, resize, setCell } from '@/modules/fleet/grid';
import { cellTypes, type TemplateDetail, type CellType } from '@/modules/fleet/types';
import { resolveConflict } from '@/modules/fleet/conflict';
import { runFleetAction } from '../fleet-actions';
import SeatGrid from './seat-grid';
import { sourceStatusPresentation } from '../presentation';
import ConflictPanel from './conflict-panel';

const CELL_LABELS: Record<CellType, string> = {
  SEAT: 'Kursi',
  DRIVER: 'Sopir',
  AISLE: 'Lorong',
  DOOR: 'Pintu',
  FACILITY: 'Fasilitas',
  EMPTY: 'Kosong',
};

export default function SeatTemplateBuilder({
  companyId,
  initial,
}: {
  companyId: string;
  initial?: TemplateDetail;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<TemplateDetail>(
    initial ?? { ...emptyGrid(4, 5), name: '', id: '', version: 0, status: 'ACTIVE', capacity: 0 },
  );
  const [rows, setRows] = useState(draft.rows);
  const [cols, setCols] = useState(draft.cols);
  const [selected, select] = useState('0:0');
  const [brush, setBrush] = useState<CellType | null>(initial ? null : 'SEAT');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [conflict, setConflict] = useState(false);
  const [latest, setLatest] = useState<TemplateDetail | null>(null);

  const cell = draft.cells.find(c => `${c.rowIndex}:${c.colIndex}` === selected) ?? draft.cells[0];
  const canDelete = Boolean(draft.id) && draft.vehicleCount === 0;
  const updateCell = (type: CellType, label = cell.label, code?: string | null) =>
    setDraft(current => ({
      ...current,
      ...setCell(current, cell.rowIndex, cell.colIndex, type, label, code),
    }));

  function handleSelectCell(row: number, col: number) {
    select(`${row}:${col}`);
    if (!brush) return;
    setDraft(current => ({ ...current, ...applyCellBrush(current, row, col, brush) }));
  }

  async function persist(status?: 'ACTIVE' | 'ARCHIVED') {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await runFleetAction(
        companyId,
        status
          ? { kind: 'templateStatus', id: draft.id, version: draft.version, status }
          : {
              kind: 'saveTemplate',
              id: draft.id || undefined,
              version: draft.version || undefined,
              input: { name: draft.name, rows: draft.rows, cols: draft.cols, cells: draft.cells },
            },
      );
      if (!result.ok) {
        setMessage(result.message);
        if (result.code === 'conflict') {
          setConflict(true);
          setLatest(null);
        }
        return;
      }
      setConflict(false);
      setLatest(null);
      setDraft({
        ...draft,
        id: result.templateId!,
        version: result.version!,
        status: status ?? draft.status,
      });
      setMessage('Template tersimpan.');
      if (!draft.id) router.push(`/admin/companies/${companyId}/seat-templates/${result.templateId}`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  async function refresh() {
    setBusy(true);
    try {
      const result = await runFleetAction(companyId, { kind: 'refreshTemplate', id: draft.id });
      if (result.ok && result.latestTemplate) setLatest(result.latestTemplate);
      else if (!result.ok) setMessage(result.message);
    } finally {
      setBusy(false);
    }
  }

  async function removeTemplate() {
    if (busy || !draft.id) return;
    if (!window.confirm('Hapus template ini secara permanen? Tindakan ini tidak dapat dibatalkan.'))
      return;
    setBusy(true);
    setMessage('');
    try {
      const result = await runFleetAction(companyId, {
        kind: 'deleteTemplate',
        id: draft.id,
        version: draft.version,
      });
      if (!result.ok) {
        setMessage(result.message);
        if (result.code === 'conflict') {
          setConflict(true);
          setLatest(null);
        }
        return;
      }
      router.push(`/admin/companies/${companyId}/seat-templates?deleted=1`);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  function choose(choice: 'adopt' | 'overwrite') {
    if (!latest) return;
    const next = resolveConflict(draft, latest, choice, choice === 'overwrite');
    setDraft(next);
    if (choice === 'adopt') {
      setRows(next.rows);
      setCols(next.cols);
      select('0:0');
    }
    setConflict(false);
    setLatest(null);
    setMessage('Pilihan diterapkan. Periksa form sebelum menyimpan.');
  }

  const totalSeats = capacity(draft);
  const statusLabel = sourceStatusPresentation(draft.status).label;

  return (
    <form
      className="admin-form fleet-studio"
      onSubmit={e => {
        e.preventDefault();
        void persist();
      }}
    >
      <fieldset disabled={busy} className="fleet-fieldset">
        <div className="fleet-topbar">
          <div className="fleet-config-grid">
            <label className="fleet-name-field">
              Nama template
              <input
                required
                maxLength={120}
                placeholder="Contoh: HiAce 14 Kursi"
                value={draft.name}
                onChange={e => setDraft({ ...draft, name: e.target.value })}
              />
            </label>
            <div className="fleet-dimensions">
              <label>
                Baris
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={rows}
                  onChange={e => setRows(Number(e.target.value))}
                />
              </label>
              <label>
                Kolom
                <input
                  type="number"
                  min={1}
                  max={8}
                  value={cols}
                  onChange={e => setCols(Number(e.target.value))}
                />
              </label>
              <button
                type="button"
                onClick={() => {
                  try {
                    const result = resize(draft, rows, cols);
                    if (
                      result.removesContent &&
                      !window.confirm('Ukuran ini akan menghapus sel berisi di luar grid. Lanjutkan?')
                    )
                      return;
                    setDraft({ ...draft, ...result.layout });
                    select('0:0');
                    setMessage('');
                  } catch {
                    setMessage('Gunakan 1–30 baris dan 1–8 kolom.');
                  }
                }}
              >
                Terapkan ukuran
              </button>
            </div>
          </div>

          <div className="fleet-action-bar">
            <div className="fleet-meta-strip">
              <span className="fleet-meta-chip">{totalSeats} kursi</span>
              <span className="fleet-meta-chip">{statusLabel}</span>
              <span className="fleet-meta-chip">
                {draft.version ? `Versi ${draft.version}` : 'Draft baru'}
              </span>
              {draft.id && typeof draft.vehicleCount === 'number' && draft.vehicleCount > 0 && (
                <span className="fleet-meta-note">
                  Terhubung ke {draft.vehicleCount} armada (arsipkan jika tidak lagi dipakai)
                </span>
              )}
            </div>

            <div className="admin-buttons">
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      'Nomori ulang semua kursi dari 01 menurut baris dan kolom? Kode manual akan diganti.',
                    )
                  ) {
                    setDraft({ ...draft, ...renumber(draft) });
                  }
                }}
              >
                Nomori ulang kursi
              </button>
              {draft.id && (
                <button
                  className={!canDelete && draft.status === 'ACTIVE' ? 'admin-danger' : undefined}
                  disabled={conflict}
                  type="button"
                  onClick={() => {
                    const status = draft.status === 'ACTIVE' ? 'ARCHIVED' : 'ACTIVE';
                    if (
                      window.confirm(
                        status === 'ARCHIVED'
                          ? 'Arsipkan template? Armada lama tetap terhubung.'
                          : 'Aktifkan kembali template?',
                      )
                    )
                      void persist(status);
                  }}
                >
                  {draft.status === 'ACTIVE' ? 'Arsipkan template' : 'Aktifkan template'}
                </button>
              )}
              {canDelete && (
                <button
                  className="admin-danger"
                  disabled={conflict}
                  type="button"
                  onClick={() => void removeTemplate()}
                >
                  Hapus permanen
                </button>
              )}
              <button className="admin-primary" disabled={conflict} type="submit">
                {busy ? 'Menyimpan…' : 'Simpan template'}
              </button>
            </div>
          </div>
        </div>

        {message && (
          <p className="admin-message" role="status" aria-live="polite">
            {message}
          </p>
        )}

        {conflict && (
          <ConflictPanel
            latest={latest}
            onRefresh={() => void refresh()}
            onAdopt={() => choose('adopt')}
            onOverwrite={() => choose('overwrite')}
          />
        )}

        <div className="fleet-brush-bar" role="group" aria-label="Mode klik cepat pada grid">
          <div className="fleet-brush-head">
            <strong>Mode klik grid</strong>
            <span>
              {brush
                ? `Kuas "${CELL_LABELS[brush]}" aktif — klik sel di denah untuk menerapkan${brush !== 'EMPTY' ? ' (klik lagi untuk mengosongkan)' : ''}.`
                : 'Mode pilih sel aktif — klik sel pada denah untuk mengatur detail di panel kanan.'}
            </span>
          </div>
          <div className="fleet-brush-pills">
            <button
              type="button"
              className={brush === null ? 'fleet-brush-btn is-active' : 'fleet-brush-btn'}
              aria-pressed={brush === null}
              onClick={() => setBrush(null)}
            >
              Pilih sel
            </button>
            {cellTypes.map(type => {
              const active = brush === type;
              return (
                <button
                  key={type}
                  type="button"
                  className={active ? 'fleet-brush-btn is-active' : 'fleet-brush-btn'}
                  aria-pressed={active}
                  onClick={() => setBrush(type)}
                >
                  {CELL_LABELS[type]}
                </button>
              );
            })}
          </div>
        </div>

        <div className="fleet-builder">
          <SeatGrid layout={draft} selected={selected} onSelect={handleSelectCell} />

          <aside className="fleet-inspector" aria-label="Detail sel terpilih">
            <div className="fleet-inspector-head">
              <h3>
                Sel baris {cell.rowIndex + 1}, kolom {cell.colIndex + 1}
              </h3>
              <span className="fleet-meta-chip">{CELL_LABELS[cell.type]}</span>
            </div>

            <div className="fleet-inspector-fields">
              <label>
                Jenis sel
                <select value={cell.type} onChange={e => updateCell(e.target.value as CellType)}>
                  {cellTypes.map(type => (
                    <option key={type} value={type}>
                      {CELL_LABELS[type]}
                    </option>
                  ))}
                </select>
              </label>

              {cell.type === 'SEAT' && (
                <label>
                  Kode kursi
                  <input
                    maxLength={8}
                    value={cell.seatCode ?? ''}
                    onChange={e => updateCell(cell.type, cell.label, e.target.value.toUpperCase())}
                  />
                </label>
              )}

              <label>
                Label opsional
                <input
                  maxLength={40}
                  placeholder="Mis. Pintu depan, Toilet"
                  value={cell.label ?? ''}
                  onChange={e => updateCell(cell.type, e.target.value, cell.seatCode)}
                />
              </label>
            </div>

            <div className="fleet-legend" aria-label="Keterangan warna sel">
              <span>Legenda denah</span>
              <div className="fleet-legend-grid">
                <span className="fleet-legend-item">
                  <i className="is-seat" aria-hidden="true" /> Kursi
                </span>
                <span className="fleet-legend-item">
                  <i className="is-driver" aria-hidden="true" /> Sopir
                </span>
                <span className="fleet-legend-item">
                  <i className="is-aisle" aria-hidden="true" /> Lorong
                </span>
                <span className="fleet-legend-item">
                  <i className="is-door" aria-hidden="true" /> Pintu
                </span>
                <span className="fleet-legend-item">
                  <i className="is-facility" aria-hidden="true" /> Fasilitas
                </span>
                <span className="fleet-legend-item">
                  <i className="is-empty" aria-hidden="true" /> Kosong
                </span>
              </div>
            </div>
          </aside>
        </div>
      </fieldset>
    </form>
  );
}
