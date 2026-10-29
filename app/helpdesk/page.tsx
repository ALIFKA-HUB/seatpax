import Link from 'next/link';
import {redirect,unstable_rethrow} from 'next/navigation';
import {statusLabels,type ComplaintStatus,type Priority,priorityLabels} from '@/modules/helpdesk/types';
import type {HelpdeskDashboardData} from '@/modules/helpdesk/staff';
import {helpdeskContext} from './data';

const statuses:ComplaintStatus[]=['MENUNGGU','DIPROSES','PERLU_DILENGKAPI','SELESAI'];
const eventLabels:Record<string,string>={SUBMITTED:'Laporan diterima',SUPPLEMENTED:'Informasi tambahan diterima',PRIORITY:'Prioritas diperbarui',DIPROSES:'Mulai diproses',PERLU_DILENGKAPI:'Meminta kelengkapan',SELESAI:'Laporan selesai'};
const date=(value:Date|string)=>new Date(value).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'});

export default async function HelpdeskPage({searchParams}:{searchParams:Promise<{search?:string;status?:string;priority?:string;page?:string}>}){
 const query=await searchParams;
 if(Object.values(query).some(Boolean)){const params=new URLSearchParams(Object.entries(query).filter(([,value])=>Boolean(value)) as [string,string][]);redirect('/helpdesk/pengaduan?'+params);}
 let data:HelpdeskDashboardData|undefined,unavailable=false;
 try{const {ctx,staff}=await helpdeskContext();data=await staff.dashboard(ctx);}
 catch(error){unstable_rethrow(error);unavailable=true;}
 if(unavailable||!data)return <section className="hd-panel" role="alert"><h1>Dashboard belum tersedia</h1><p>Data Helpdesk belum dapat dimuat. Muat ulang halaman atau periksa akses Petugas Helpdesk dan Admin perusahaan.</p></section>;
 return <>
   <header className="hd-heading"><p className="hd-kicker">Ruang kerja Helpdesk</p><h1>Dashboard</h1><p>Ringkasan pengaduan dan pekerjaan yang perlu ditangani.</p></header>
   <section className="hd-stat-grid" aria-label="Jumlah laporan menurut status">{statuses.map(status=><Link className="hd-stat" data-status={status} key={status} href={'/helpdesk/pengaduan?status='+status}><i aria-hidden="true"/><span>{statusLabels[status]}</span><strong>{data.counts[status]}</strong></Link>)}</section>
   <div className="hd-dashboard-grid">
    <section className="hd-panel"><div className="hd-section-title"><h2>Antrean penanganan</h2><Link href="/helpdesk/pengaduan?status=MENUNGGU">Lihat semua</Link></div>{data.queue.length?<ul className="hd-queue">{data.queue.map(row=><li key={row.id}><Link href={'/helpdesk/'+row.id}>{row.title}</Link><p><span className="hd-code">{row.code}</span> · {row.priority?priorityLabels[row.priority as Priority]:'Prioritas belum ditentukan'} · {date(row.created_at)}</p></li>)}</ul>:<p className="hd-empty">Tidak ada laporan yang menunggu pemeriksaan.</p>}</section>
    <section className="hd-panel"><div className="hd-section-title"><h2>Aktivitas terbaru</h2></div>{data.events.length?<ol className="hd-activity">{data.events.map(event=><li key={event.id}><Link href={'/helpdesk/'+event.case_id}>{eventLabels[event.kind]||event.kind}</Link><p>{date(event.created_at)}</p></li>)}</ol>:<p className="hd-empty">Belum ada aktivitas penanganan.</p>}</section>
   </div>
   <section className="hd-panel hd-dashboard-lower hd-table-scroll"><div className="hd-section-title"><h2>Pengaduan terbaru</h2><Link href="/helpdesk/pengaduan">Buka daftar</Link></div>{data.recent.length?<table className="hd-staff-table"><thead><tr><th>Pengaduan</th><th>Status</th><th>Prioritas</th><th>Diterima</th></tr></thead><tbody>{data.recent.map(row=><tr key={row.id}><td><Link href={'/helpdesk/'+row.id}>{row.title}</Link><div className="hd-code">{row.code}</div></td><td>{statusLabels[row.status]}</td><td>{row.priority?priorityLabels[row.priority as Priority]:'Belum ditentukan'}</td><td>{date(row.created_at)}</td></tr>)}</tbody></table>:<p className="hd-empty">Belum ada pengaduan.</p>}</section>
  </>;
}
