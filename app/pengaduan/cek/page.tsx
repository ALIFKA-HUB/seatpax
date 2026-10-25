import Link from 'next/link';
import {ArrowLeft, EnvelopeSimple} from '@phosphor-icons/react/ssr';
import ComplaintTracker from '../components/complaint-tracker';
import ComplaintHistory from '../components/complaint-history';
import '../complaint-workspace.css';

export default async function TrackComplaint({searchParams}:{searchParams:Promise<{kode?:string}>}) {
  const p=await searchParams;
  return <div className="hd-workspace hd-track-page">
    <header className="hd-workspace-heading">
      <Link href="/pengaduan" className="hd-return"><ArrowLeft size={16} aria-hidden="true"/>Pusat pengaduan</Link>
      <h1>Cek pengaduan</h1>
      <p>Lihat perkembangan laporan dan hasil penanganannya dalam satu tempat.</p>
    </header>
    <div className="hd-workspace-grid">
      <div className="hd-tracker-workspace"><ComplaintTracker initialCode={(p.kode||'').slice(0,100)}/></div>
      <aside className="hd-workspace-aside" aria-label="Riwayat dan panduan"><ComplaintHistory/><div className="hd-aside-note"><EnvelopeSimple size={21} weight="light" aria-hidden="true"/><p>Nomor pengaduan tersedia di halaman konfirmasi dan email setelah laporan dikirim.</p></div></aside>
    </div>
  </div>;
}
