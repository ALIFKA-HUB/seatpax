'use client';
import { useId, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck } from './crew-icons';
import type { BoardingRecord, ManifestView, PassengerProfile } from '@/modules/boarding/types';
import { createSubmissionGate } from '@/modules/boarding/ui-state';
import { boardPassengerAction } from '../boarding-actions';
import { wibTime } from './passenger-profile';

export default function BoardingForm({
  tripId,
  profile,
  stops,
  source,
  onBoarded,
}: {
  tripId: string;
  profile: PassengerProfile;
  stops: ManifestView['stops'];
  source: 'QR' | 'MANIFEST';
  onBoarded?: (record: BoardingRecord) => void;
}) {
  const router = useRouter();
  const selectId = useId();
  const gate = useRef(createSubmissionGate());
  const [stopId, setStopId] = useState(profile.fromStopId);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [record, setRecord] = useState(profile.boarding);

  function submit(event: FormEvent) {
    event.preventDefault();
    void gate.current.run(async () => {
      setPending(true);
      setMessage('');
      try {
        const result = await boardPassengerAction(tripId, {
          ticketId: profile.ticketId,
          stopId,
          source,
        });
        if (!result.ok) {
          setMessage(result.message);
          return;
        }
        setRecord(result.result.boarding);
        onBoarded?.(result.result.boarding);
        setMessage(
          result.result.alreadyBoarded
            ? 'Boarding sudah tercatat sebelumnya.'
            : 'Boarding berhasil dicatat.',
        );
        router.refresh();
      } catch {
        setMessage('Koneksi terputus. Coba lagi untuk memeriksa catatan yang sama.');
      } finally {
        setPending(false);
      }
    });
  }

  if (record) {
    return (
      <div className="boarding-result crew-state-success" role="status">
        <span className="crew-step-chip">Langkah 1 · Konfirmasi boarding</span>
        <strong className="crew-result-title">
          <IconCheck size={18} />
          <span>Sudah naik</span>
        </strong>
        <p>{wibTime(record.boardedAt)}</p>
      </div>
    );
  }

  return (
    <form className="boarding-form crew-operation" onSubmit={submit} aria-busy={pending}>
      <span className="crew-step-chip">Langkah 1 · Wajib terlebih dahulu</span>
      <h3>Konfirmasi boarding</h3>
      <label htmlFor={selectId}>Stop boarding</label>
      <select
        id={selectId}
        value={stopId}
        onChange={e => setStopId(e.target.value)}
        disabled={pending}
        required
      >
        {stops.map(s => (
          <option value={s.id} key={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <p className="crew-muted">Boarding hanya dapat dicatat di stop asal: {profile.fromName}.</p>
      <button className="crew-primary" type="submit" disabled={pending}>
        {pending ? 'Mencatat…' : 'Tandai sudah naik'}
      </button>
      {message && (
        <p className="crew-message" role="status" aria-live="polite">
          {message}
        </p>
      )}
    </form>
  );
}
