import Link from 'next/link';
import { Info } from '@phosphor-icons/react/ssr';
import CaseActions,{RetryMail} from './case-actions';
import {statusLabels,priorityLabels,categoryLabels,type ComplaintStatus,type Category,type Priority} from '@/modules/helpdesk/types';
import type {createHelpdeskStaff} from '@/modules/helpdesk/staff';
type Detail=NonNullable<Awaited<ReturnType<ReturnType<typeof createHelpdeskStaff>['detail']>>>;
const eventLabels:Record<string,string>={SUBMITTED:'Laporan diterima',SUPPLEMENTED:'Informasi tambahan dari pelapor',PRIORITY:'Prioritas diperbarui',DIPROSES:'Mulai diproses',PERLU_DILENGKAPI:'Meminta kelengkapan',SELESAI:'Laporan selesai'};
const mailLabels:Record<string,string>={QUEUED:'Menunggu pengiriman',SENDING:'Sedang dikirim',ACCEPTED:'Diterima penyedia email',FAILED:'Gagal dikirim',UNKNOWN:'Hasil pengiriman belum diketahui'};
const statusTone:Record<ComplaintStatus,string>={MENUNGGU:'is-warn',DIPROSES:'is-info',PERLU_DILENGKAPI:'is-purple',SELESAI:'is-ok'};
const priorityTone:Record<Priority,string>={HIGH:'is-danger',MEDIUM:'is-warn',LOW:'is-neutral'};

export default function CaseDetailView({id,data,readOnly=false,backHref='/helpdesk/pengaduan',embedded=false}:{id:string;data:Detail;readOnly?:boolean;backHref?:string;embedded?:boolean}){
 const {row,events,files,jobs,writable}=data,canWrite=writable&&!readOnly;
 const statusKey=row.status as ComplaintStatus;
 const priorityKey=row.priority as Priority|null;
 return <>
  {!embedded&&<Link className="hd-back-link" href={backHref}>← Kembali ke pengaduan</Link>}
  {embedded?(
   <section className="dash-card admin-panel-modern hd-detail-summary">
    <div className="hd-detail-summary-top">
     <div>
      <span className="hd-code-pill">{String(row.code)}</span>
      <h2>{String(row.title)}</h2>
     </div>
     <div className="fleet-meta-strip">
      <span className={`admin-status-pill ${statusTone[statusKey]??'is-neutral'}`}>{statusLabels[statusKey]}</span>
      <span className="admin-status-pill is-neutral">{categoryLabels[row.category as Category]}</span>
      {priorityKey&&<span className={`admin-status-pill ${priorityTone[priorityKey]??'is-neutral'}`}>{priorityLabels[priorityKey]}</span>}
     </div>
    </div>
    {readOnly&&(
     <div className="admin-callout-info">
      <Info size={18} weight="duotone" aria-hidden="true" />
      <span>Mode pemantauan Admin. Hanya Petugas Helpdesk yang dapat mengubah status atau prioritas laporan.</span>
     </div>
    )}
   </section>
  ):(
   <>
    <header className="hd-heading"><p className="hd-code">{String(row.code)}</p><h1>{String(row.title)}</h1><p>{statusLabels[statusKey]} · {categoryLabels[row.category as Category]} · {priorityKey?priorityLabels[priorityKey]:'Prioritas belum ditentukan'}</p></header>
    {readOnly&&<p className="hd-notice">Mode pemantauan Admin. Hanya Petugas Helpdesk yang dapat menangani laporan.</p>}
   </>
  )}
  <div className="hd-detail-grid"><div className="hd-detail-primary">
   <section className={embedded?'dash-card admin-panel-modern hd-section-card':'hd-panel'}><h2>Informasi pelapor</h2><p>{String(row.name)}<br/><a href={'mailto:'+String(row.email)}>{String(row.email)}</a></p>{row.booking_reference&&<p>Referensi pesanan: {String(row.booking_reference)} (isian pelapor, belum diverifikasi)</p>}<h2>Uraian laporan</h2><p className="hd-staff-note">{String(row.description)}</p><h3>Lampiran privat</h3>{files.length?<ul>{files.map(file=><li key={String(file.id)}><a href={'/api/helpdesk/attachments/'+file.id}>{String(file.name)} ({Math.ceil(Number(file.size)/1024)} KB)</a></li>)}</ul>:<p className="hd-muted-label">Tidak ada lampiran.</p>}</section>
   <section className={embedded?'dash-card admin-panel-modern hd-section-card':'hd-panel'}><h2>Riwayat penanganan</h2>{events.length?<ol className="hd-timeline">{events.map(event=><li key={String(event.id)}><strong>{eventLabels[String(event.kind)]||String(event.kind)}</strong><small>{new Date(event.created_at).toLocaleString('id-ID')}</small>{event.note&&<p className="hd-staff-note">{String(event.note)}</p>}</li>)}</ol>:<p className="hd-muted-label">Belum ada riwayat.</p>}</section>
  </div><aside className="hd-detail-side">{canWrite?<CaseActions id={id} revision={Number(row.revision)} status={statusKey} priority={priorityKey}/>:<section className={embedded?'dash-card admin-panel-modern hd-section-card':'hd-panel'}><h2>Status penanganan</h2><p>{statusLabels[statusKey]} · {priorityKey?priorityLabels[priorityKey]:'Prioritas belum ditentukan'}</p>{row.status==='SELESAI'&&<p>Laporan selesai dan tidak dapat diubah.</p>}</section>}
   <section className={embedded?'dash-card admin-panel-modern hd-section-card':'hd-panel'}><h2>Notifikasi email</h2><p>Status diterima penyedia email tidak menjamin email sudah masuk kotak masuk pelapor.</p>{jobs.length?jobs.map(job=><div key={String(job.id)}><p>{mailLabels[String(job.state)]||String(job.state)}{job.error_code==='configuration'?' · Konfigurasi email belum lengkap':job.error_code==='superseded'?' · Permintaan kelengkapan sudah ditindaklanjuti atau diganti':''}</p>{canWrite&&job.state==='FAILED'&&['configuration','rejected','temporary'].includes(String(job.error_code))&&<RetryMail jobId={String(job.id)}/>}</div>):<p className="hd-muted-label">Belum ada email untuk laporan ini.</p>}</section>
  </aside></div>
 </>;
}
