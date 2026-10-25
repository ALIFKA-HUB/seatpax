import Link from 'next/link';
import {ArrowLeft, Check, EnvelopeSimple, ShieldCheck} from '@phosphor-icons/react/ssr';
import ComplaintForm from '../components/complaint-form';
import '../complaint-workspace.css';

export default async function CreateComplaint({searchParams}:{searchParams:Promise<{pesanan?:string}>}) {
  const params=await searchParams;
  return <div className="hd-workspace hd-compose">
    <header className="hd-workspace-heading">
      <Link href="/pengaduan" className="hd-return"><ArrowLeft size={16} aria-hidden="true"/>Pusat pengaduan</Link>
      <h1>Buat pengaduan</h1>
      <p>Ceritakan kendala Anda. Kami bantu periksa dan tindak lanjuti.</p>
    </header>
    <div className="hd-workspace-grid">
      <ComplaintForm bookingReference={(params.pesanan||'').slice(0,120)}/>
      <aside className="hd-workspace-aside" aria-label="Panduan pengaduan">
        <section className="hd-guide-card"><span className="hd-guide-icon"><EnvelopeSimple size={25} weight="light" aria-hidden="true"/></span><h2>Kabarnya lewat email.</h2><p>Gunakan email aktif untuk menerima nomor pengaduan dan permintaan informasi tambahan.</p><ul><li><Check size={16} aria-hidden="true"/>Jelaskan kejadian dan waktunya.</li><li><Check size={16} aria-hidden="true"/>Sertakan bukti yang berkaitan.</li><li><Check size={16} aria-hidden="true"/>Simpan nomor setelah mengirim.</li></ul></section>
        <div className="hd-aside-note"><ShieldCheck size={21} weight="light" aria-hidden="true"/><p>Prioritas ditentukan oleh petugas. Hindari menyertakan PIN, OTP, atau kata sandi.</p></div>
        <div className="hd-aside-link"><h2>Sudah pernah melapor?</h2><p>Gunakan nomor pengaduan untuk melihat perkembangannya.</p><Link href="/pengaduan/cek">Cek pengaduan <span aria-hidden="true">→</span></Link></div>
      </aside>
    </div>
  </div>;
}
