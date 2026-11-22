'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  IsoWeekday,
  PublicationProjection,
  TripDraftInput,
  TripRecord,
} from '@/modules/trip/types';
import {
  expandRecurringSchedule,
  formatUtcDate,
  parseWibInstant,
  toWibInput,
} from '@/modules/trip/time';
import { DomainError } from '@/modules/access/transaction';
import {
  deleteTripDraftAction,
  publishTripAction,
  saveRecurringTripsAction,
  saveTripAction,
} from '../trip-actions';
import TripDetail from './trip-detail';
import AdminSelect from './admin-select';
import { queueAdminToast } from '../admin-toast';

type Choices = {
  routes: { id: string; name: string; status: string }[];
  vehicles: { id: string; name: string; status: string; defaultServiceClassId: string }[];
  classes: { id: string; name: string; status: string }[];
};

type CutoffMode = 'auto' | '15' | '30' | '60' | 'custom';

function splitWib(value: string | null | undefined): { date: string; time: string } {
  if (!value || !value.includes('T')) return { date: '', time: '' };
  const [date, time] = value.split('T');
  return { date: date ?? '', time: (time ?? '').slice(0, 5) };
}

function joinWib(date: string, time: string): string {
  return date && time ? `${date}T${time}` : '';
}

function computeCutoffWib(departureWib: string, minutesBefore: number): string | null {
  if (!departureWib) return null;
  try {
    const depMs = Date.parse(parseWibInstant(departureWib));
    return toWibInput(new Date(depMs - minutesBefore * 60_000).toISOString());
  } catch {
    return null;
  }
}

function detectCutoffMode(departureWib: string, salesCloseWib: string | null): CutoffMode {
  if (!salesCloseWib) return 'auto';
  for (const minutes of [15, 30, 60] as const) {
    if (computeCutoffWib(departureWib, minutes) === salesCloseWib) {
      return String(minutes) as CutoffMode;
    }
  }
  return 'custom';
}

function formatWibReadable(wib: string): string | null {
  if (!wib) return null;
  try {
    const iso = parseWibInstant(wib);
    return (
      new Intl.DateTimeFormat('id-ID', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Jakarta',
      }).format(new Date(iso)) + ' WIB'
    );
  } catch {
    return null;
  }
}

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
  const [depDate, setDepDate] = useState(() => splitWib(initialDraft.departureWib).date);
  const [depTime, setDepTime] = useState(() => splitWib(initialDraft.departureWib).time);
  const [cutoffDate, setCutoffDate] = useState(() => splitWib(initialDraft.salesCloseWib).date);
  const [cutoffTime, setCutoffTime] = useState(() => splitWib(initialDraft.salesCloseWib).time);
  const [cutoffMode, setCutoffMode] = useState<CutoffMode>(() =>
    detectCutoffMode(initialDraft.departureWib, initialDraft.salesCloseWib),
  );
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

  function updateSingleDeparture(nextDate: string, nextTime: string) {
    setDepDate(nextDate);
    setDepTime(nextTime);
    const nextDep = joinWib(nextDate, nextTime);
    const nextClose =
      cutoffMode === '15' || cutoffMode === '30' || cutoffMode === '60'
        ? computeCutoffWib(nextDep, Number(cutoffMode))
        : draft.salesCloseWib;
    if (nextClose) {
      const splitClose = splitWib(nextClose);
      setCutoffDate(splitClose.date);
      setCutoffTime(splitClose.time);
    }
    setDraft({
      ...draft,
      departureWib: nextDep,
      salesCloseWib: nextClose,
    });
    setConfirming(false);
  }

  function chooseCutoffMode(mode: CutoffMode) {
    setCutoffMode(mode);
    setConfirming(false);
    if (mode === 'auto') {
      setDraft({ ...draft, salesCloseWib: null });
      return;
    }
    if (mode === '15' || mode === '30' || mode === '60') {
      const computed = computeCutoffWib(draft.departureWib, Number(mode));
      if (computed) {
        const splitClose = splitWib(computed);
        setCutoffDate(splitClose.date);
        setCutoffTime(splitClose.time);
      }
      setDraft({
        ...draft,
        salesCloseWib: computed,
      });
      return;
    }
    const seedDate = cutoffDate || depDate;
    const seedTime = cutoffTime || depTime;
    setCutoffDate(seedDate);
    setCutoffTime(seedTime);
    setDraft({
      ...draft,
      salesCloseWib: joinWib(seedDate, seedTime) || null,
    });
  }

  function updateCustomCutoff(nextDate: string, nextTime: string) {
    setCutoffDate(nextDate);
    setCutoffTime(nextTime);
    change('salesCloseWib', joinWib(nextDate, nextTime) || null);
  }

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

  function showError(text: string) {
    setMessage(text);
    queueAdminToast({ title: 'Perjalanan belum tersimpan', message: text, tone: 'error' });
  }

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
          showError(result.message);
          return;
        }
        queueAdminToast({
          title: `${result.data.count} draft perjalanan dibuat`,
          message: 'Buka tiap perjalanan di daftar untuk menugaskan crew dan mempublikasikan.',
          tone: 'ok',
        });
        router.push(base);
        router.refresh();
        return;
      }

      const result = await saveTripAction(companyId, {
        input: draft,
        id: initial?.id,
        revision: counter,
      });
      if (!result.ok) {
        showError(result.message);
        setConflict(result.code === 'conflict');
        return;
      }
      setSaved({ ...draft });
      setCounter(result.data.revision);
      setMessage('');
      if (!initial) {
        queueAdminToast({
          title: 'Draft perjalanan dibuat',
          message: `${draft.name.trim()} siap dilengkapi crew & dipublikasikan.`,
          tone: 'ok',
        });
        router.push(base + '/' + result.data.tripId);
      } else {
        queueAdminToast({
          title: 'Draft perjalanan tersimpan',
          message: `${draft.name.trim()} telah diperbarui.`,
          tone: 'ok',
        });
        router.refresh();
      }
    } catch {
      showError('Koneksi terputus. Draft tetap tersedia; coba lagi.');
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
        showError(result.message);
        setConflict(result.code === 'conflict');
        return;
      }
      setConfirming(false);
      queueAdminToast({
        title: 'Perjalanan dipublikasikan',
        message: 'Jadwal kini aktif dan terbuka untuk penjualan tiket.',
        tone: 'ok',
      });
      router.refresh();
    } catch {
      showError('Hasil belum diterima. Coba buka kembali perjalanan; publikasi ulang aman.');
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
        showError(result.message);
        setConflict(result.code === 'conflict');
        return;
      }
      queueAdminToast({
        title: 'Draft perjalanan dihapus permanen',
        message: `${draft.name.trim()} telah dihapus dari daftar perjalanan.`,
        tone: 'ok',
      });
      router.push(base);
      router.refresh();
    } catch {
      showError('Koneksi terputus. Coba lagi.');
    } finally {
      setBusy(false);
    }
  }

  const selectOptions = (items: { id: string; name: string; status: string }[], current: string) =>
    items
      .filter(i => i.status === 'ACTIVE' || i.id === current)
      .map(i => ({
        value: i.id,
        label: i.name + (i.status !== 'ACTIVE' ? ' · Nonaktif' : ''),
      }));

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
            <div className="trip-form-head">
              <h2>Detail perjalanan</h2>
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
            </div>
          )}

          <div className="admin-fields trip-fields-2col">
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
              <AdminSelect
                required
                placeholder="Pilih rute"
                value={draft.routeId}
                onChange={next => change('routeId', next)}
                options={selectOptions(choices.routes, draft.routeId)}
              />
            </label>
            <label>
              Armada
              <AdminSelect
                required
                placeholder="Pilih armada"
                value={draft.vehicleId}
                onChange={selectVehicle}
                options={selectOptions(choices.vehicles, draft.vehicleId)}
              />
            </label>
            <label>
              Kelas layanan
              <AdminSelect
                required
                placeholder="Pilih kelas"
                value={draft.serviceClassId}
                onChange={next => change('serviceClassId', next)}
                options={selectOptions(choices.classes, draft.serviceClassId)}
              />
              <small>Kelas bisa berbeda dari default armada; tarif mengikuti pilihan ini.</small>
            </label>
          </div>

          <div className="trip-schedule-section">
            {!recurring ? (
              (() => {
                const depText = formatWibReadable(draft.departureWib);
                const cutoffText = formatWibReadable(draft.salesCloseWib ?? '');
                return (
                  <div className="trip-recurring-section">
                    <div className="trip-recurring-head">
                      <div>
                        <strong>Jadwal keberangkatan</strong>
                        <p>
                          Tentukan tanggal &amp; jam berangkat dari titik awal rute; jadwal stop
                          berikutnya otomatis mengikuti rute.
                        </p>
                      </div>
                    </div>

                    <div className="admin-fields trip-fields-2col trip-recurring-fields">
                      <label>
                        Tanggal berangkat (WIB)
                        <input
                          type="date"
                          required
                          value={depDate}
                          onChange={e => updateSingleDeparture(e.target.value, depTime)}
                        />
                      </label>
                      <label>
                        Jam berangkat (WIB)
                        <input
                          type="time"
                          required
                          value={depTime}
                          onChange={e => updateSingleDeparture(depDate, e.target.value)}
                        />
                      </label>
                    </div>

                    <div className="trip-cutoff-block">
                      <div className="trip-recurring-head">
                        <div>
                          <strong>
                            Batas akhir beli tiket <small>(opsional)</small>
                          </strong>
                          <p>
                            Pilih kapan penjualan tiket online ditutup sebelum bus/shuttle
                            berangkat.
                          </p>
                        </div>
                        <div className="trip-preset-row" role="group" aria-label="Batas akhir beli tiket">
                          <button
                            type="button"
                            className={`trip-preset-btn${cutoffMode === 'auto' ? ' is-active' : ''}`}
                            onClick={() => chooseCutoffMode('auto')}
                          >
                            Saat berangkat (default)
                          </button>
                          <button
                            type="button"
                            className={`trip-preset-btn${cutoffMode === '15' ? ' is-active' : ''}`}
                            onClick={() => chooseCutoffMode('15')}
                          >
                            15 mnt sebelum
                          </button>
                          <button
                            type="button"
                            className={`trip-preset-btn${cutoffMode === '30' ? ' is-active' : ''}`}
                            onClick={() => chooseCutoffMode('30')}
                          >
                            30 mnt sebelum
                          </button>
                          <button
                            type="button"
                            className={`trip-preset-btn${cutoffMode === '60' ? ' is-active' : ''}`}
                            onClick={() => chooseCutoffMode('60')}
                          >
                            1 jam sebelum
                          </button>
                          <button
                            type="button"
                            className={`trip-preset-btn${cutoffMode === 'custom' ? ' is-active' : ''}`}
                            onClick={() => chooseCutoffMode('custom')}
                          >
                            Atur tanggal/jam
                          </button>
                        </div>
                      </div>

                      {cutoffMode === 'custom' && (
                        <div className="admin-fields trip-fields-2col trip-recurring-fields">
                          <label>
                            Tanggal tutup penjualan (WIB)
                            <input
                              type="date"
                              required
                              value={cutoffDate}
                              onChange={e => updateCustomCutoff(e.target.value, cutoffTime)}
                            />
                          </label>
                          <label>
                            Jam tutup penjualan (WIB)
                            <input
                              type="time"
                              required
                              value={cutoffTime}
                              onChange={e => updateCustomCutoff(cutoffDate, e.target.value)}
                            />
                          </label>
                        </div>
                      )}
                    </div>

                    {depText && (
                      <p className="trip-recurring-summary is-ready" role="status" aria-live="polite">
                        Berangkat: {depText} ·{' '}
                        {cutoffMode === 'auto'
                          ? 'Penjualan tiket otomatis ditutup saat jadwal berangkat tiap titik naik.'
                          : cutoffText
                            ? `Penjualan tiket ditutup serentak: ${cutoffText}.`
                            : 'Menunggu jam tutup penjualan lengkap.'}
                      </p>
                    )}
                  </div>
                );
              })()
            ) : (
              !initial && (
                <div className="trip-recurring-section">
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

                  <div className="admin-fields trip-fields-2col trip-recurring-fields">
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
                      Tutup penjualan (menit sebelum berangkat)
                      <input
                        type="number"
                        min={0}
                        max={10080}
                        placeholder="Opsional (default: saat berangkat)"
                        value={salesCloseBeforeMin}
                        onChange={e => setSalesCloseBeforeMin(e.target.value)}
                      />
                      <small>Kosongkan jika tiket boleh dibeli hingga jam berangkat tiap titik naik.</small>
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
                  </div>

                  <p
                    className={`trip-recurring-summary${schedulePreview.ok ? ' is-ready' : ' is-warn'}`}
                    role="status"
                    aria-live="polite"
                  >
                    {schedulePreview.hint}
                  </p>
                </div>
              )
            )}
          </div>

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
        {message && (
          <p className="admin-flash-error" role="alert" aria-live="polite">
            {message}
          </p>
        )}
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
