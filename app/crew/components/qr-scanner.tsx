'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { IconCamera, IconClipboard, IconInfo, IconStop } from './crew-icons';
import type { ManifestView, PassengerProfile as Profile } from '@/modules/boarding/types';
import { createScannerController } from '@/modules/boarding/scanner-controller';
import { applyBoardingToCurrentProfile, applySnackToCurrentProfile } from '@/modules/boarding/ui-state';
import { resolveBoardingAction } from '../boarding-actions';
import PassengerProfile from './passenger-profile';
import BoardingForm from './boarding-form';
import SnackForm from './snack-form';

export default function TicketScanner({ tripId, stops }: { tripId: string; stops: ManifestView['stops'] }) {
  const video = useRef<HTMLVideoElement>(null);
  const mounted = useRef(true);
  const controller = useRef<ReturnType<typeof createScannerController<Profile>> | null>(null);
  const [running, setRunning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [message, setMessage] = useState('');
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      controller.current?.close();
    };
  }, []);

  async function start() {
    if (starting || running) return;
    controller.current?.close();
    setProfile(null);
    setMessage('');
    setStarting(true);
    const next = createScannerController<Profile>({
      factory: async decoded => {
        const { default: QrScanner } = await import('qr-scanner');
        if (!video.current) throw new Error('Camera view unavailable');
        return new QrScanner(video.current, result => decoded(result.data), {
          preferredCamera: 'environment',
          returnDetailedScanResult: true,
          highlightScanRegion: true,
        });
      },
      resolve: async token => {
        const result = await resolveBoardingAction(tripId, token);
        if (!result.ok) throw new Error('Ticket unavailable');
        return result.profile;
      },
      onResult: value => {
        if (mounted.current && controller.current === next) {
          setProfile(value);
          setMessage('Tiket ditemukan. Periksa penumpang dan stop sebelum mencatat boarding.');
        }
      },
      onError: value => {
        if (mounted.current && controller.current === next) setMessage(value);
      },
      onRunning: value => {
        if (mounted.current && controller.current === next) setRunning(value);
      },
    });
    controller.current = next;
    await next.start();
    if (mounted.current && controller.current === next) setStarting(false);
  }

  function close() {
    controller.current?.close();
    setRunning(false);
    setStarting(false);
    setMessage('Kamera ditutup.');
  }

  return (
    <div className="crew-scanner-panel">
      <div className="crew-panel-head">
        <h2>Pemindai QR tiket</h2>
        <span
          className={`crew-status-pill ${
            running ? 'is-ok' : starting ? 'is-warn' : profile ? 'is-info' : 'is-neutral'
          }`}
        >
          {running
            ? 'Kamera aktif'
            : starting
              ? 'Membuka kamera'
              : profile
                ? 'Tiket terbaca'
                : 'Siap memindai'}
        </span>
      </div>

      <div className="crew-stack crew-scanner-body">
        <div className="crew-callout">
          <IconInfo size={18} />
          <p>
            Scan hanya membuka profil penumpang. Boarding dan penyerahan snack tetap perlu Anda konfirmasi secara eksplisit.
          </p>
        </div>

        <div className="crew-camera-frame">
          <video
            ref={video}
            className="boarding-camera"
            muted
            playsInline
            aria-label="Pratinjau kamera scanner"
          />
        </div>

        <p className="crew-camera-state">
          {starting
            ? 'Membuka kamera…'
            : running
              ? 'Kamera aktif. Arahkan ke QR tiket penumpang.'
              : profile
                ? 'Scan selesai. Periksa profil di bawah.'
                : 'Kamera belum dinyalakan.'}
        </p>

        <div className="boarding-camera-actions crew-actions crew-scan-actions">
          <button
            type="button"
            className="crew-primary"
            onClick={() => {
              void start();
            }}
            disabled={starting || running}
          >
            <IconCamera size={18} />
            <span>{starting ? 'Membuka kamera…' : profile ? 'Scan tiket berikutnya' : 'Mulai scan'}</span>
          </button>
          <button type="button" onClick={close} disabled={!starting && !running}>
            <IconStop size={18} />
            <span>Tutup kamera</span>
          </button>
          <Link className="crew-button" href={`/crew/trips/${tripId}/manifest`}>
            <IconClipboard size={18} />
            <span>Cari di manifest →</span>
          </Link>
        </div>

        {message && (
          <p className="crew-message crew-scan-feedback" role="status" aria-live="polite">
            {message}
          </p>
        )}

        {profile && (
          <div className="crew-stack crew-scan-result">
            <PassengerProfile profile={profile} />
            <div className="crew-ops-grid">
              <section className="crew-panel crew-table-card">
                <BoardingForm
                  key={profile.ticketId}
                  tripId={tripId}
                  profile={profile}
                  stops={stops}
                  source="QR"
                  onBoarded={record => setProfile(current => applyBoardingToCurrentProfile(current, record))}
                />
              </section>
              <section className="crew-panel crew-table-card">
                <SnackForm
                  key={`snack-${profile.ticketId}`}
                  tripId={tripId}
                  profile={profile}
                  onClaimed={claim => setProfile(current => applySnackToCurrentProfile(current, claim))}
                />
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
