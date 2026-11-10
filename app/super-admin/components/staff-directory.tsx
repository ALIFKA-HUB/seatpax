import Link from 'next/link';
import {Users} from '@phosphor-icons/react/dist/ssr/Users';
import {UserCheck} from '@phosphor-icons/react/dist/ssr/UserCheck';
import {UserMinus} from '@phosphor-icons/react/dist/ssr/UserMinus';
import {CaretRight} from '@phosphor-icons/react/dist/ssr/CaretRight';
import {MagnifyingGlass} from '@phosphor-icons/react/dist/ssr/MagnifyingGlass';
import type {StaffDirectoryQuery,StaffDirectorySnapshot,StaffRole} from '@/modules/staff-directory/types';
import {createStaffFormAction,updateStaffFormAction} from '../staff-actions';

const roleLabels:Record<StaffRole,string>={ADMIN_PO:'Operasional',HELPDESK:'Helpdesk',CREW:'Crew'};
export function directoryHref(query:StaffDirectoryQuery,change:Partial<StaffDirectoryQuery>={}){
 const next={...query,...change},params=new URLSearchParams();
 if(next.q)params.set('q',next.q);if(next.status!=='all')params.set('status',next.status);if(next.page>1)params.set('page',String(next.page));
 return '/super-admin'+(params.size?'?'+params.toString():'')+'#petugas';
}
export function StaffSummary({snapshot}:{snapshot:StaffDirectorySnapshot}){
 const cards=[{key:'all' as const,label:'Petugas terdaftar',value:snapshot.counts.total,action:'Lihat semua petugas',Icon:Users},{key:'active' as const,label:'Akses aktif',value:snapshot.counts.active,action:'Lihat akun aktif',Icon:UserCheck},{key:'disabled' as const,label:'Akses nonaktif',value:snapshot.counts.disabled,action:'Lihat akun nonaktif',Icon:UserMinus}];
 return <dl className="super-summary">{cards.map(({key,label,value,action,Icon})=><div className={`super-metric super-metric-${key}`} key={key}>
  <dt>{label}<Icon size={28} aria-hidden="true"/></dt><dd><strong>{value}</strong><span>petugas</span></dd>
  <Link href={directoryHref(snapshot.query,{status:key,page:1})} className="super-metric-action">{action}<CaretRight size={16} aria-hidden="true"/></Link>
 </div>)}</dl>;
}
export function StaffDirectory({snapshot}:{snapshot:StaffDirectorySnapshot}){
 const {query,rows,counts,page,pageSize,totalPages,filteredTotal}=snapshot;
 const from=filteredTotal?(page-1)*pageSize+1:0,to=Math.min(page*pageSize,filteredTotal);
 return <section className="super-directory" id="petugas" aria-labelledby="staff-title">
  <div className="super-directory-heading">
   <div>
    <h2 id="staff-title">Daftar petugas</h2>
    <p>Akses Operasional, Helpdesk, dan Crew.</p>
   </div>
   <details className="super-add-staff" id="tambah-petugas">
    <summary>+ Tambah petugas</summary>
    <form action={createStaffFormAction} className="super-add-form">
     <div className="super-form-field">
      <label htmlFor="staff-name">Nama lengkap</label>
      <input id="staff-name" name="name" type="text" required maxLength={80} placeholder="Nama lengkap petugas"/>
     </div>
     <div className="super-form-field">
      <label htmlFor="staff-email">Email</label>
      <input id="staff-email" name="email" type="email" required placeholder="nama@perusahaan.com"/>
     </div>
     <div className="super-form-field">
      <label htmlFor="staff-role">Role</label>
      <select id="staff-role" name="role" defaultValue="ADMIN_PO">
       <option value="ADMIN_PO">Operasional</option>
       <option value="HELPDESK">Helpdesk</option>
       <option value="CREW">Crew</option>
      </select>
     </div>
     <button type="submit">Tambah petugas</button>
    </form>
   </details>
  </div>
  <div className="super-directory-toolbar">
   <nav className="super-staff-tabs" aria-label="Filter status petugas">{[['all','Semua'],['active','Aktif'],['disabled','Nonaktif']].map(([status,label])=><Link key={status} href={directoryHref(query,{status:status as StaffDirectoryQuery['status'],page:1})} aria-current={query.status===status?'page':undefined}>{label}</Link>)}</nav>
   <form action="/super-admin" method="get" className="super-staff-search">
    <label htmlFor="staff-search" className="super-sr-only">Cari nama atau email petugas</label><div><MagnifyingGlass size={18} aria-hidden="true"/><input id="staff-search" name="q" type="search" defaultValue={query.q} maxLength={80} placeholder="Cari petugas"/></div>
    <input type="hidden" name="status" value={query.status}/><button type="submit">Cari</button>
   </form>
  </div>
  {rows.length?<table className="super-staff-table"><thead><tr><th scope="col">Nama & email</th><th scope="col">Role</th><th scope="col">Status</th><th scope="col">Kelola akses</th></tr></thead><tbody>{rows.map(person=>{
   const activeRole=person.roles.find(r=>r.status==='ACTIVE')?.role??person.roles[0]?.role??'ADMIN_PO';
   return <tr key={person.id}>
    <td><div className="super-staff-person"><span className="super-avatar" aria-hidden="true">{person.name.slice(0,2).toUpperCase()}</span><div><strong>{person.name}</strong><span>{person.email??'Email belum tersedia'}</span></div></div></td>
    <td><ul className="super-staff-roles">{person.roles.map(role=><li key={role.role}>{roleLabels[role.role]}{role.status==='DISABLED'&&<span>Nonaktif</span>}</li>)}</ul></td>
    <td><span className={`super-staff-status${person.status==='DISABLED'?' is-disabled':''}`}>{person.status==='ACTIVE'?'Aktif':'Nonaktif'}</span></td>
    <td className="super-staff-action-cell">
     <div className="super-staff-actions">
      <form action={updateStaffFormAction} className="super-inline-form">
       <input type="hidden" name="userId" value={person.id}/>
       <input type="hidden" name="status" value="ACTIVE"/>
       <select name="role" defaultValue={activeRole} aria-label={`Role ${person.name}`}>
        <option value="ADMIN_PO">Operasional</option>
        <option value="HELPDESK">Helpdesk</option>
        <option value="CREW">Crew</option>
       </select>
       <button type="submit">Simpan role</button>
      </form>
      <form action={updateStaffFormAction} className="super-inline-form">
       <input type="hidden" name="userId" value={person.id}/>
       <input type="hidden" name="role" value={activeRole}/>
       <input type="hidden" name="status" value={person.status==='ACTIVE'?'DISABLED':'ACTIVE'}/>
       <button type="submit">{person.status==='ACTIVE'?'Nonaktifkan':'Aktifkan'}</button>
      </form>
     </div>
    </td>
   </tr>;
  })}</tbody></table>:<p className="super-directory-empty">{counts.total?'Tidak ada petugas yang sesuai filter.':'Belum ada petugas di perusahaan ini.'}</p>}
  <div className="super-directory-footer"><p role="status">Menampilkan {from}–{to} dari {filteredTotal} petugas</p>
   <nav aria-label="Halaman daftar petugas" className="super-pagination">
    {page>1?<Link href={directoryHref(query,{page:page-1})}>Sebelumnya</Link>:<span aria-disabled="true">Sebelumnya</span>}
    <span>Halaman {page} dari {totalPages}</span>
    {page<totalPages?<Link href={directoryHref(query,{page:page+1})}>Berikutnya</Link>:<span aria-disabled="true">Berikutnya</span>}
   </nav>
  </div>
 </section>;
}
