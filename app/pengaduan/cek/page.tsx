import ComplaintTracker from '../components/complaint-tracker';
import ComplaintHistory from '../components/complaint-history';
export default async function TrackComplaint({searchParams}:{searchParams:Promise<{kode?:string}>}){const p=await searchParams;return <><header className="hd-heading"><h1>Cek pengaduan</h1><p>Masukkan nomor dari email konfirmasi atau pilih pengaduan yang tersimpan di browser ini.</p></header><ComplaintTracker initialCode={(p.kode||'').slice(0,100)}/><ComplaintHistory/></>;}
