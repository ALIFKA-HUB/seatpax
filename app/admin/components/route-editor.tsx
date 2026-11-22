'use client';
import { useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Info } from '@phosphor-icons/react/ssr';
import type { MasterRow, OrderedStop, RouteRow } from '@/modules/route/repository';
import { runAdminAction, type ActionResult } from '../actions';
import AdminSelect from './admin-select';

type Row = { stopId: string; arrival: string; departure: string };

function parseWholeMin(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) return null;
  const num = Number(trimmed);
  return Number.isSafeInteger(num) ? num : null;
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} mnt`;
  const hours = Math.floor(min / 60);
  const rem = min % 60;
  return rem ? `${hours} jam ${rem} mnt` : `${hours} jam`;
}

function describeStopSchedule(row: Row, index: number, total: number): { text: string; warn?: boolean } | null {
  const arr = parseWholeMin(row.arrival);
  const dep = parseWholeMin(row.departure);
  if (arr === null && dep === null) return null;

  if (index === 0) {
    if (dep === 0) return { text: 'Titik keberangkatan awal (menit ke-0).' };
    if (dep !== null && dep > 0) {
      return { text: 'Berangkat titik awal wajib diisi 0 agar bisa dipakai jadwal perjalanan.', warn: true };
    }
    return null;
  }

  if (index === total - 1) {
    if (arr !== null) return { text: `Estimasi tiba dari titik awal: ${formatDuration(arr)}.` };
    if (dep !== null) return { text: 'Isi menit tiba di tujuan akhir agar durasi rute terbaca.', warn: true };
    return null;
  }

  if (arr !== null && dep !== null) {
    if (dep < arr) {
      return { text: 'Menit berangkat tidak boleh lebih kecil dari menit tiba.', warn: true };
    }
    if (dep === arr) {
      return { text: `Tiba & langsung berangkat di menit ke-${arr} (+${formatDuration(arr)}).` };
    }
    return {
      text: `Tiba +${formatDuration(arr)} · singgah ${dep - arr} mnt · berangkat +${formatDuration(dep)}.`,
    };
  }

  if (arr !== null) return { text: `Tiba +${formatDuration(arr)} dari titik awal.` };
  return { text: `Berangkat +${formatDuration(dep!)} dari titik awal.` };
}

export default function RouteEditor({
  companyId,
  choices,
  route,
  initialStops = [],
}: {
  companyId: string;
  choices: MasterRow[];
  route?: RouteRow;
  initialStops?: OrderedStop[];
}) {
  const router = useRouter();
  const prefix = useId();
  const busy = useRef(false);
  const [name, setName] = useState(route?.name ?? '');
  const [code, setCode] = useState(route?.code ?? '');
  const [rows, setRows] = useState<Row[]>(
    initialStops.length
      ? initialStops.map(s => ({
          stopId: s.stopId,
          arrival: s.arrivalOffsetMin?.toString() ?? '',
          departure: s.departureOffsetMin?.toString() ?? '',
        }))
      : [
          { stopId: '', arrival: '', departure: '' },
          { stopId: '', arrival: '', departure: '' },
        ],
  );
  const [revision, setRevision] = useState(route?.revision ?? 1);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [conflict, setConflict] = useState(false);
  const [latest, setLatest] = useState<Extract<ActionResult, { ok: true }> | null>(null);

  const update = (i: number, field: keyof Row, value: string) =>
    setRows(rows.map((r, j) => (j === i ? { ...r, [field]: value } : r)));

  const move = (i: number, d: number) => {
    const next = [...rows];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    setRows(next);
  };

  async function refresh() {
    if (!route || busy.current) return;
    busy.current = true;
    setPending(true);
    try {
      const r = await runAdminAction(companyId, { kind: 'refresh', routeId: route.id });
      if (r.ok && r.revision && r.latestRoute) {
        setLatest(r);
        setMessage(
          'Data terbaru ditampilkan di bawah. Draf Anda tetap ada. Pilih data terbaru atau izinkan draf menimpanya.',
        );
      } else if (!r.ok) setMessage(r.message);
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  function resolve(useLatest: boolean) {
    if (!latest?.revision || !latest.latestRoute) return;
    if (
      !useLatest &&
      !window.confirm('Simpan berikutnya akan menimpa data rute terbaru dengan draf Anda. Lanjutkan?')
    ) {
      return;
    }
    if (useLatest) {
      setName(latest.latestRoute.name);
      setCode(latest.latestRoute.code ?? '');
      setRows(
        latest.latestRoute.stops.map(s => ({
          stopId: s.stopId,
          arrival: s.arrivalOffsetMin?.toString() ?? '',
          departure: s.departureOffsetMin?.toString() ?? '',
        })),
      );
    }
    setRevision(latest.revision);
    setConflict(false);
    setLatest(null);
    setMessage(
      useLatest
        ? 'Data terbaru dipakai.'
        : 'Draf dipertahankan. Periksa sebelum menyimpan untuk menimpa data terbaru.',
    );
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy.current) return;
    busy.current = true;
    setPending(true);
    setMessage('');
    try {
      const r = await runAdminAction(companyId, {
        kind: 'route',
        id: route?.id,
        revision: route ? revision : undefined,
        input: {
          name,
          code: code.trim() || null,
          stops: rows.map(s => ({
            stopId: s.stopId,
            arrivalOffsetMin: s.arrival === '' ? null : Number(s.arrival),
            departureOffsetMin: s.departure === '' ? null : Number(s.departure),
          })),
        },
      });
      if (r.ok) {
        setRevision(r.revision ?? revision);
        setConflict(false);
        setMessage('Rute tersimpan.');
        if (!route && r.routeId) router.push(`/admin/companies/${companyId}/routes/${r.routeId}`);
        else router.refresh();
      } else {
        setMessage(r.message);
        setConflict(r.code === 'conflict');
      }
    } catch {
      setMessage('Koneksi terputus. Coba lagi.');
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  async function status() {
    if (!route || busy.current || !window.confirm('Ubah status rute? Tiket/trip lama tidak dihapus.')) {
      return;
    }
    busy.current = true;
    setPending(true);
    try {
      const r = await runAdminAction(companyId, {
        kind: 'status',
        id: route.id,
        revision,
        status: route.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE',
      });
      if (r.ok) {
        setRevision(r.revision ?? revision);
        router.refresh();
        setMessage('Status rute diperbarui.');
      } else {
        setMessage(r.message);
        setConflict(r.code === 'conflict');
      }
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  async function removeRoute() {
    if (
      !route ||
      busy.current ||
      !window.confirm('Hapus rute ini secara permanen? Urutan stop dan tarif rute juga ikut dihapus.')
    ) {
      return;
    }
    busy.current = true;
    setPending(true);
    setMessage('');
    try {
      const r = await runAdminAction(companyId, { kind: 'deleteRoute', id: route.id, revision });
      if (r.ok) {
        router.push(`/admin/companies/${companyId}/routes?deleted=1`);
        router.refresh();
      } else {
        setMessage(r.message);
        setConflict(r.code === 'conflict');
      }
    } catch {
      setMessage('Koneksi terputus. Coba lagi.');
    } finally {
      busy.current = false;
      setPending(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={submit}>
      <fieldset disabled={pending}>
        <div className="admin-fields">
          <label htmlFor={prefix + 'name'}>
            Nama rute
            <input
              id={prefix + 'name'}
              required
              maxLength={120}
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </label>
          <label htmlFor={prefix + 'code'}>
            <span className="admin-label-row">
              Kode <small>(opsional)</small>
            </span>
            <input
              id={prefix + 'code'}
              maxLength={32}
              value={code}
              onChange={e => setCode(e.target.value)}
              placeholder="bandung-bogor"
            />
          </label>
        </div>

        <div className="admin-callout-info route-stop-guide">
          <Info size={18} weight="duotone" aria-hidden="true" />
          <span>
            Susun minimal 2 stop. Isi waktu dalam <strong>menit kumulatif dari titik awal</strong>{' '}
            (boleh dikosongkan sementara). Contoh: titik awal berangkat <strong>0</strong>, stop
            singgah tiba <strong>60</strong> &amp; berangkat <strong>70</strong> (jeda 10 mnt),
            tujuan akhir tiba <strong>120</strong>.
          </span>
        </div>

        <ol className="admin-stop-list">
          {rows.map((r, i) => {
            const isFirst = i === 0;
            const isLast = i === rows.length - 1;
            const roleLabel = isFirst ? 'Titik awal' : isLast ? 'Tujuan akhir' : 'Singgah';
            const arrivalLabel = isFirst ? 'Tiba (opsional)' : 'Tiba (menit ke-)';
            const departureLabel = isLast ? 'Berangkat (opsional)' : 'Berangkat (menit ke-)';
            const arrivalPlaceholder = isFirst ? '—' : isLast ? 'Misal: 120' : 'Misal: 60';
            const departurePlaceholder = isFirst ? '0 (awal)' : isLast ? '—' : 'Misal: 70';
            const summary = describeStopSchedule(r, i, rows.length);

            return (
              <li key={i}>
                <div className="admin-stop-number">{i + 1}</div>
                <label htmlFor={prefix + 'stop' + i}>
                  <span className="admin-label-row">
                    Stop <span className={`admin-stop-role${isFirst ? ' is-start' : isLast ? ' is-end' : ''}`}>{roleLabel}</span>
                  </span>
                  <AdminSelect
                    id={prefix + 'stop' + i}
                    required
                    placeholder="Pilih stop"
                    value={r.stopId}
                    onChange={next => update(i, 'stopId', next)}
                    options={choices
                      .filter(c => c.status === 'ACTIVE' || c.id === r.stopId)
                      .map(c => ({
                        value: c.id,
                        label: c.name + (c.status === 'INACTIVE' ? ' (nonaktif)' : ''),
                      }))}
                  />
                </label>
                <label htmlFor={prefix + 'arrival' + i}>
                  {arrivalLabel}
                  <input
                    id={prefix + 'arrival' + i}
                    type="number"
                    min={0}
                    max={10080}
                    step={1}
                    placeholder={arrivalPlaceholder}
                    value={r.arrival}
                    onChange={e => update(i, 'arrival', e.target.value)}
                  />
                </label>
                <label htmlFor={prefix + 'departure' + i}>
                  {departureLabel}
                  <input
                    id={prefix + 'departure' + i}
                    type="number"
                    min={0}
                    max={10080}
                    step={1}
                    placeholder={departurePlaceholder}
                    value={r.departure}
                    onChange={e => update(i, 'departure', e.target.value)}
                  />
                </label>
                <div className="admin-row-buttons">
                  <button
                    type="button"
                    disabled={i === 0}
                    aria-label={'Naikkan stop ' + (i + 1)}
                    onClick={() => move(i, -1)}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    disabled={i === rows.length - 1}
                    aria-label={'Turunkan stop ' + (i + 1)}
                    onClick={() => move(i, 1)}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    disabled={rows.length <= 2}
                    aria-label={'Hapus stop ' + (i + 1)}
                    onClick={() => setRows(rows.filter((_, j) => i !== j))}
                  >
                    ×
                  </button>
                </div>
                {summary && (
                  <p className={`admin-stop-summary${summary.warn ? ' is-warn' : ''}`}>
                    {summary.text}
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        <div className="admin-buttons">
          <button
            type="button"
            disabled={rows.length >= 50}
            onClick={() => setRows([...rows, { stopId: '', arrival: '', departure: '' }])}
          >
            + Tambah stop
          </button>
          <button type="submit" className="admin-primary">
            {pending ? 'Menyimpan…' : 'Simpan rute'}
          </button>
          {route && (
            <button type="button" onClick={status}>
              {route.status === 'ACTIVE' ? 'Nonaktifkan rute' : 'Aktifkan rute'}
            </button>
          )}
          {route?.canDelete === true && (
            <button type="button" className="admin-danger" onClick={removeRoute}>
              Hapus permanen
            </button>
          )}
        </div>
        {route?.canDelete === false && (
          <p className="admin-hint">
            Rute masih terhubung ke perjalanan — gunakan Nonaktifkan rute sebagai gantinya.
          </p>
        )}
      </fieldset>
      <p className="admin-message" role="status">
        {message}
      </p>
      {conflict && (
        <button type="button" disabled={pending} onClick={refresh}>
          Muat versi terbaru (pertahankan isian)
        </button>
      )}
      <section aria-label="Data rute terbaru">
        {latest?.latestRoute && (
          <>
            <h3>Versi terbaru {latest.revision}</h3>
            <p>
              {latest.latestRoute.name} — {latest.latestRoute.code ?? 'Tanpa kode'}
            </p>
            <ol>
              {latest.latestRoute.stops.map((s, i) => (
                <li key={s.stopId}>
                  {i + 1}. {s.name}: tiba {s.arrivalOffsetMin ?? '—'}, berangkat{' '}
                  {s.departureOffsetMin ?? '—'}
                </li>
              ))}
            </ol>
            <button type="button" disabled={pending} onClick={() => resolve(true)}>
              Pakai data terbaru
            </button>
            <button type="button" disabled={pending} onClick={() => resolve(false)}>
              Izinkan draf menimpa versi ini
            </button>
          </>
        )}
      </section>
    </form>
  );
}
