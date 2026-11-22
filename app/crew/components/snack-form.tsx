'use client';
import { useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { IconCheck, IconPackage } from './crew-icons';
import type { PassengerProfile } from '@/modules/boarding/types';
import type { SnackClaim } from '@/modules/snack/types';
import { createSubmissionGate } from '@/modules/boarding/ui-state';
import { queueAdminToast } from '@/app/admin/admin-toast';
import { claimSnackAction } from '../snack-actions';
import { wibTime } from './passenger-profile';

export default function SnackForm({
  tripId,
  profile,
  onClaimed,
}: {
  tripId: string;
  profile: PassengerProfile;
  onClaimed?: (claim: SnackClaim) => void;
}) {
  const router = useRouter();
  const gate = useRef(createSubmissionGate());
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const [record, setRecord] = useState<PassengerProfile['snack']>(null);
  const snack = record ?? profile.snack;

  function submit(event: FormEvent) {
    event.preventDefault();
    if (!profile.boarding || snack) return;
    void gate.current.run(async () => {
      setPending(true);
      setMessage('');
      try {
        const result = await claimSnackAction(tripId, { ticketId: profile.ticketId });
        if (!result.ok) {
          setMessage(result.message);
          queueAdminToast({
            title: 'Gagal mencatat snack',
            message: result.message,
            tone: 'error',
          });
          return;
        }
        setRecord({ claimedAt: result.result.claim.claimedAt });
        onClaimed?.(result.result.claim);
        queueAdminToast({
          title: 'Snack diserahkan',
          message: `Penyerahan snack untuk ${profile.name} (Kursi ${profile.seatCode}) telah dicatat.`,
          tone: 'ok',
        });
        router.refresh();
      } catch {
        const errorText = 'Koneksi terputus. Coba lagi untuk memeriksa catatan yang sama.';
        setMessage(errorText);
        queueAdminToast({
          title: 'Koneksi terputus',
          message: errorText,
          tone: 'error',
        });
      } finally {
        setPending(false);
      }
    });
  }

  if (snack) {
    return (
      <div className="boarding-result crew-state-success" role="status">
        <div className="crew-step-row">
          <span className="crew-step-chip">Langkah 2</span>
          <span className="crew-status-pill is-ok">Layanan snack</span>
        </div>
        <strong className="crew-result-title">
          <IconCheck size={18} />
          <span>Snack sudah diserahkan</span>
        </strong>
        <p>{wibTime(snack.claimedAt)}</p>
      </div>
    );
  }

  return (
    <form className="boarding-form crew-operation" onSubmit={submit} aria-busy={pending}>
      <div className="crew-step-row">
        <span className="crew-step-chip">Langkah 2</span>
        <span className="crew-status-pill is-neutral">Setelah penumpang naik</span>
      </div>
      <h3>Handover snack</h3>
      <strong>Snack belum diserahkan</strong>
      {!profile.boarding && (
        <p className="crew-muted">Catat boarding dahulu sebelum menyerahkan snack.</p>
      )}
      <button type="submit" disabled={pending || !profile.boarding}>
        <IconPackage size={18} />
        <span>{pending ? 'Mencatat…' : 'Serahkan snack'}</span>
      </button>
      {message && (
        <p className="crew-message" role="status" aria-live="polite">
          {message}
        </p>
      )}
    </form>
  );
}
