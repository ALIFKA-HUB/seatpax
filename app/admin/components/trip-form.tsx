'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  IsoWeekday,
  PublicationProjection,
  TripDraftInput,
  TripRecord,
} from '@/modules/trip/types';
import { expandRecurringSchedule, formatUtcDate, toWibInput } from '@/modules/trip/time';
import { DomainError } from '@/modules/access/transaction';
import {
  deleteTripDraftAction,
  publishTripAction,
  saveRecurringTripsAction,
  saveTripAction,
} from '../trip-actions';
import TripDetail from './trip-detail';

type Choices = {
  routes: { id: string; name: string; status: string }[];
  vehicles: { id: string; name: string; status: string; defaultServiceClassId: string }[];
  classes: { id: string; name: string; status: string }[];
};

const WEEKDAYS: readonly { id: IsoWeekday; short: string; full: string }[] = [
  { id: 1, short: 'Sen', full: 'Senin' },
  { id: 2, short: 'Sel', full: 'Selasa' },
  { id: 3, short: 'Rab', full: 'Rabu' },
  { id: 4, short: 'Kam', full: 'Kamis' },
  { id: 5, short: 'Jum', full: 'Jumat' },
  { id: 6, short: 'Sab', full: 'Sabtu' },
  { id: 7, short: 'Min', full: 'Minggu' },
];

const ALL_DAYS: IsoWeekday[] = [1, 2, 3, 4, 5, 6, 7];
const WORK_DAYS: IsoWeekday[] = [1, 2, 3, 4, 5];
const WEEKEND_DAYS: IsoWeekday[] = [6, 7];

function defaultWibDateRange(): { startDate: string; endDate: string } {
  const nowWib = Date.now() + 7 * 3600000;
  return {
    startDate: formatUtcDate(nowWib),
    endDate: formatUtcDate(nowWib + 6 * 86_400_000),
  };
}

function sameDays(a: readonly IsoWeekday[], b: readonly IsoWeekday[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i]);
}

export default function TripForm({
  companyId,
  initial,
  choices,
  preview,
}: {
  companyId: string;
  initial?: TripRecord;
  choices: Choices;
  preview?: { projection: PublicationProjection | null; blockers: string[] };
}) {
  const router = useRouter();
  const initialDraft: TripDraftInput = {
    name: initial?.name ?? '',
    routeId: initial?.routeId ?? '',
    vehicleId: initial?.vehicleId ?? '',
    serviceClassId: initial?.serviceClassId ?? '',
    departureWib: initial ? toWibInput(initial.departureAt) : '',
    salesCloseWib: initial?.salesCloseAt ? toWibInput(initial.salesCloseAt) : null,
  };

  const [draft, setDraft] = useState(initialDraft);
  const [saved, setSaved] = useState(initialDraft);
  const [counter, setCounter] = useState(initial?.revision);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [conflict, setConflict] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [recurring, setRecurring] = useState(false);
  const [weekdays, setWeekdays] = useState<IsoWeekday[]>(WORK_DAYS);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [departureTime, setDepartureTime] = useState('07:00');
  const [salesCloseBeforeMin, setSalesCloseBeforeMin] = useState('');

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved);
  const base = `/admin/companies/${companyId}/trips`;

  const change = <K extends keyof TripDraftInput>(key: K, value: TripDraftInput[K]) => {
    setDraft({ ...draft, [key]: value });
    setConfirming(false);
  };

  function selectVehicle(vehicleId: string) {
    setDraft({
      ...draft,
      vehicleId,
      serviceClassId:
        draft.serviceClassId ||
        choices.vehicles.find(v => v.id === vehicleId)?.defaultServiceClassId ||
        '',
    });
    setConfirming(false);
  }

  function enableRecurring() {
    setRecurring(true);
    setMessage('');
    if (!startDate && !endDate) {
      const range = defaultWibDateRange();
      setStartDate(range.startDate);
      setEndDate(range.endDate);
    }
  }

  function toggleWeekday(day: IsoWeekday) {
    setWeekdays(current =>
      current.includes(day)
        ? current.filter(d => d !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  }

  const parsedCutoffMin =
    salesCloseBeforeMin.trim() === '' ? null : Number(salesCloseBeforeMin.trim());

  const schedulePreview = (() => {
    if (!recurring) return { ok: false as const, count: 0, hint: '' };
    if (!startDate || !endDate || !departureTime) {
      return {
        ok: false as const,
        count: 0,
        hint: 'Pilih hari beroperasi, jam berangkat, dan rentang tanggal untuk melihat jumlah jadwal.',
      };
    }
    try {
      const occurrences = expandRecurringSchedule({
        startDate,
        endDate,
        departureTime,
        weekdays,
        salesCloseBeforeMin: parsedCutoffMin,
      });
      const dayLabels = WEEKDAYS.filter(d => weekdays.includes(d.id))
        .map(d => d.short)
        .join(', ');
      return {
        ok: true as const,
        count: occurrences.length,
        hint: `Akan dibuat ${occurrences.length} draft perjalanan (${dayLabels} · pukul ${departureTime} WIB).`,
      };
    } catch (error) {
      return {
        ok: false as const,
        count: 0,
        hint:
          error instanceof DomainError
            ? error.message
            : 'Periksa hari beroperasi, jam, dan rentang tanggal.',
      };
    }
  })();

  async function save() {
    setBusy(true);
    setMessage('');
    try {
      if (!initial && recurring) {
        const result = await saveRecurringTripsAction(companyId, {
          input: {
            name: draft.name,
            routeId: draft.routeId,
            vehicleId: draft.vehicleId,
            serviceClassId: draft.serviceClassId,
            startDate,
            endDate,
            departureTime,
            weekdays,
            salesCloseBeforeMin: parsedCutoffMin,
          },
        });
        if (!result.ok) {
          setMessage(result.message);
          return;
        }
        router.push(`${base}?created=${result.data.count}`);
        router.refresh();
        return;
      }

      const result = await saveTripAction(companyId, {
        input: draft,
        id: initial?.id,
        revision: counter,
      });
      if (!result.ok) {
        setMessage(result.message);
        setConflict(result.code === 'conflict');
        return;
      }
      setSaved({ ...draft });
      setCounter(result.data.revision);
      setMessage('Draft tersimpan.');
      if (!initial) router.push(base + '/' + result.data.tripId);
      else router.refresh();
    } catch {
      setMessage('Koneksi terputus. Draft tetap tersedia; coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    if (!initial || counter === undefined) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await publishTripAction(companyId, { id: initial.id, revision: counter });
      if (!result.ok) {
        setMessage(result.message);
        setConflict(result.code === 'conflict');
        return;
      }
      setConfirming(false);
      router.refresh();
    } catch {
      setMessage('Hasil belum diterima. Coba buka kembali perjalanan; publikasi ulang aman.');
    } finally {
      setBusy(false);
    }
  }

  async function removeDraft() {
    if (!initial || counter === undefined || busy) return;
    if (!window.confirm('Hapus draft perjalanan ini secara permanen? Tindakan ini tidak dapat dibatalkan.')) return;
    setBusy(true);
    setMessage('');
    try {
      const result = await deleteTripDraftAction(companyId, { id: initial.id, revision: counter });
      if (!result.ok) {
        setMessage(result.message);
        setConflict(result.code === 'conflict');
        return;
      }
      router.push(base);
      router.refresh();
    } catch {
      setMessage('Koneksi terputus. Coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  const options = (items: { id: string; name: string; status: string }[], current: string) =>
    items
      .filter(i => i.status === 'ACTIVE' || i.id === current)
      .map(i => (
        <option key={i.id} value={i.id}>
          {i.name}
          {i.status !== 'ACTIVE' ? ' · Nonaktif' : ''}
        </option>
      ));

  return (
    <>
      <form
        className="admin-form"
        onSubmit={e => {
          e.preventDefault();
          void save();
        }}
      >
        <fieldset disabled={busy} className="fleet-fieldset">
          {!initial && (
            <div className="trip-mode-bar" role="group" aria-label="Pola jadwal keberangkatan">
              <button
                type="button"
                className={`trip-mode-btn${!recurring ? ' is-active' : ''}`}
                aria-pressed={!recurring}
                onClick={() => {
                  setRecurring(false);
                  setMessage('');
                }}
              >
                Sekali jalan
              </button>
              <button
                type="button"
                className={`trip-mode-btn${recurring ? ' is-active' : ''}`}
                aria-pressed={recurring}
                onClick={enableRecurring}
              >
                Berulang (pilih hari)
              </button>
            </div>
          )}

          <div className="admin-fields">
            <label>
              Nama perjalanan
              <input
                value={draft.name}
                maxLength={120}
                required
                placeholder="Contoh: Bandung - Jakarta Pagi"
                onChange={e => change('name', e.target.value)}
              />
            </label>
            <label>
              Rute
              <select
                required
                value={draft.routeId}
                onChange={e => change('routeId', e.target.value)}
              >
                <option value="">Pilih rute</option>
                {options(choices.routes, draft.routeId)}
              </select>
            </label>
            <label>
              Armada
              <select
                required
                value={draft.vehicleId}
                onChange={e => selectVehicle(e.target.value)}
              >
                <option value="">Pilih armada</option>
                {options(choices.vehicles, draft.vehicleId)}
              </select>
            </label>
            <label>
              Kelas layanan
              <select
                required
                value={draft.serviceClassId}
                onChange={e => change('serviceClassId', e.target.value)}
              >
                <option value="">Pilih kelas</option>
                {options(choices.classes, draft.serviceClassId)}
              </select>
              <small>Kelas bisa berbeda dari default armada; tarif mengikuti pilihan ini.</small>
            </label>

            {!recurring && (
              <>
                <label>
                  Berangkat stop pertama (WIB)
                  <input
                    type="datetime-local"
                    required
                    value={draft.departureWib}
                    onChange={e => change('departureWib', e.target.value)}
                  />
                </label>
                <label>
                  Batas penjualan global (WIB, opsional)
                  <input
                    type="datetime-local"
                    value={draft.salesCloseWib ?? ''}
                    onChange={e => change('salesCloseWib', e.target.value || null)}
                  />
                </label>
              </>
            )}
          </div>

          {!initial && recurring && (
            <div className="trip-recurring-panel">
              <div className="trip-recurring-head">
                <div>
                  <strong>Hari beroperasi</strong>
                  <p>Pilih hari keberangkatan seperti pengingat alarm, lalu tentukan rentang tanggal.</p>
                </div>
                <div className="trip-preset-row" role="group" aria-label="Preset hari beroperasi">
                  <button
                    type="button"
                    className={`trip-preset-btn${sameDays(weekdays, ALL_DAYS) ? ' is-active' : ''}`}
                    onClick={() => setWeekdays(ALL_DAYS)}
                  >
                    Setiap hari
                  </button>
                  <button
                    type="button"
                    className={`trip-preset-btn${sameDays(weekdays, WORK_DAYS) ? ' is-active' : ''}`}
                    onClick={() => setWeekdays(WORK_DAYS)}
                  >
                    Hari kerja
                  </button>
                  <button
                    type="button"
                    className={`trip-preset-btn${sameDays(weekdays, WEEKEND_DAYS) ? ' is-active' : ''}`}
                    onClick={() => setWeekdays(WEEKEND_DAYS)}
                  >
                    Akhir pekan
                  </button>
                </div>
              </div>

              <div className="trip-weekday-row" role="group" aria-label="Pilih hari dalam seminggu">
                {WEEKDAYS.map(day => {
                  const active = weekdays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      className={`trip-weekday-pill${active ? ' is-selected' : ''}`}
                      aria-pressed={active}
                      aria-label={day.full}
                      onClick={() => toggleWeekday(day.id)}
                    >
                      {day.short}
                    </button>
                  );
                })}
              </div>

              <div className="admin-fields trip-recurring-fields">
                <label>
                  Jam berangkat (WIB)
                  <input
                    type="time"
                    required
                    value={departureTime}
                    onChange={e => setDepartureTime(e.target.value)}
                  />
                </label>
                <label>
                  Mulai tanggal (WIB)
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                  />
                </label>
                <label>
                  Sampai tanggal (WIB)
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                  />
                </label>
                <label>
                  Tutup penjualan (menit sebelum berangkat)
                  <input
                    type="number"
                    min={0}
                    max={10080}
                    placeholder="Opsional (default: saat berangkat)"
                    value={salesCloseBeforeMin}
                    onChange={e => setSalesCloseBeforeMin(e.target.value)}
                  />
                </label>
              </div>

              <p
                className={`trip-recurring-summary${schedulePreview.ok ? ' is-ready' : ' is-warn'}`}
                role="status"
                aria-live="polite"
              >
                {schedulePreview.hint}
              </p>
            </div>
          )}

          <div className="admin-buttons">
            <button
              className="admin-primary"
              disabled={conflict || (!initial && recurring && !schedulePreview.ok)}
              type="submit"
            >
              {busy
                ? 'Memproses…'
                : !initial && recurring
                  ? schedulePreview.ok
                    ? `Buat ${schedulePreview.count} draft perjalanan`
                    : 'Buat jadwal berulang'
                  : 'Simpan draft'}
            </button>
            {initial && (
              <>
                <button
                  type="button"
                  disabled={dirty || conflict || Boolean(preview?.blockers.length)}
                  onClick={() => setConfirming(true)}
                >
                  Buka penjualan
                </button>
                {initial.status === 'DRAFT' && (
                  <button
                    type="button"
                    className="admin-danger"
                    disabled={conflict}
                    onClick={() => void removeDraft()}
                  >
                    Hapus draft
                  </button>
                )}
              </>
            )}
          </div>

          {dirty && initial && (
            <p className="admin-hint">
              Simpan perubahan sebelum membuka penjualan. Preview di bawah mengikuti draft terakhir
              yang tersimpan.
            </p>
          )}

          {confirming && (
            <div className="fleet-conflict" role="region" aria-label="Konfirmasi publikasi">
              <p>Jadwal, tarif, armada, dan layout perjalanan akan terkunci setelah penjualan dibuka.</p>
              <div className="admin-buttons">
                <button type="button" className="admin-primary" onClick={() => void publish()}>
                  Konfirmasi buka penjualan
                </button>
                <button type="button" onClick={() => setConfirming(false)}>
                  Kembali ke draft
                </button>
              </div>
            </div>
          )}

          {conflict && (
            <p className="fleet-conflict">
              Data berubah. Input Anda masih tersedia.{' '}
              <a href={base + '/' + initial?.id}>Muat versi terbaru dan tinjau ulang</a> sebelum
              menyimpan.
            </p>
          )}
        </fieldset>
        <p role="status" aria-live="polite">
          {message}
        </p>
      </form>

      {preview && (
        <section className="trip-preview">
          <h2>Preview draft tersimpan</h2>
          {preview.blockers.length > 0 && (
            <ul>
              {preview.blockers.map(b => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
          {preview.projection && (
            <TripDetail
              detail={{
                trip: { ...initial!, identity: preview.projection.identity },
                ...preview.projection,
                inventoryCount: 0,
              }}
              preview
            />
          )}
        </section>
      )}
    </>
  );
}
