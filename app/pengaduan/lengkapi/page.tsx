import SupplementForm from '../components/supplement-form';
export default async function SupplementPage({searchParams}:{searchParams:Promise<{kode?:string}>}){const p=await searchParams;return <><header className="hd-heading"><h1>Lengkapi pengaduan</h1><p>Tambahkan informasi yang diminta petugas. Nomor pengaduan Anda tetap sama.</p></header><SupplementForm code={(p.kode||'').slice(0,100)}/></>;}
