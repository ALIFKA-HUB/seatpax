'use client';

import {useId,useRef,useState} from 'react';
import {MagnifyingGlass,MapPin,PencilSimple,Plus,X} from '@phosphor-icons/react/ssr';
import type {MasterRow} from '@/modules/route/repository';
import MasterForm from './master-form';

export default function StopDirectory({companyId,stops}:{companyId:string;stops:MasterRow[]}) {
 const prefix=useId(),dialog=useRef<HTMLDialogElement>(null);
 const [query,setQuery]=useState(''),[status,setStatus]=useState('ALL');
 const [editing,setEditing]=useState<MasterRow>(),[formKey,setFormKey]=useState(0);
 const [pending,setPending]=useState(false),[feedback,setFeedback]=useState('');
 const needle=query.trim().toLocaleLowerCase('id-ID');
 const visible=stops.filter(stop=>(status==='ALL'||stop.status===status)&&[stop.name,stop.city??''].some(value=>value.toLocaleLowerCase('id-ID').includes(needle)));

 function openForm(stop?:MasterRow) {
  setEditing(stop);setFormKey(value=>value+1);setFeedback('');
  dialog.current?.showModal();
 }
 function closeForm(){if(!pending)dialog.current?.close();}
 function saved(){dialog.current?.close();setFeedback(editing?'Perubahan titik tersimpan.':'Titik baru berhasil ditambahkan.');}

 return <div className="stop-directory">
  <div className="admin-breadcrumb" aria-label="Lokasi halaman"><span>Data perjalanan</span><span aria-hidden="true">/</span><strong>Titik naik & turun</strong></div>
  <header className="admin-header stop-page-heading"><div><h1>Titik naik & turun</h1><p>Atur lokasi yang dilayani PO Anda.</p></div><button type="button" className="admin-primary" onClick={()=>openForm()}><Plus size={19} aria-hidden="true"/>Tambah titik</button></header>
  <p className="stop-feedback" role="status">{feedback}</p>
  <section className="stop-panel" aria-label="Daftar titik naik dan turun">
   <div className="stop-toolbar"><label className="stop-search" htmlFor={prefix+'search'}><MagnifyingGlass size={21} aria-hidden="true"/><span className="stop-sr-only">Cari nama lokasi atau kota</span><input id={prefix+'search'} type="search" placeholder="Cari nama lokasi atau kota" value={query} onChange={event=>setQuery(event.target.value)}/></label><label className="stop-status" htmlFor={prefix+'status'}>Status<select id={prefix+'status'} value={status} onChange={event=>setStatus(event.target.value)}><option value="ALL">Semua status</option><option value="ACTIVE">Aktif</option><option value="INACTIVE">Nonaktif</option></select></label></div>
   {visible.length?<div className="stop-table-scroll" role="region" aria-label="Tabel lokasi" tabIndex={0}><table className="stop-table"><thead><tr><th scope="col">Lokasi</th><th scope="col">Kota / kabupaten</th><th scope="col">Status</th><th scope="col"><span className="stop-sr-only">Aksi</span></th></tr></thead><tbody>{visible.map(stop=><tr key={stop.id}><td><strong>{stop.name}</strong><small>{stop.address||'Alamat belum ditambahkan'}</small></td><td>{stop.city||'—'}</td><td><span className={`stop-status-badge${stop.status==='ACTIVE'?' is-active':''}`}>{stop.status==='ACTIVE'?'Aktif':'Nonaktif'}</span></td><td><button type="button" className="stop-edit" aria-label={`Edit ${stop.name}`} onClick={()=>openForm(stop)}><PencilSimple size={20} aria-hidden="true"/></button></td></tr>)}</tbody></table></div>:<div className="stop-empty"><MapPin size={32} aria-hidden="true"/><h2>{stops.length?'Tidak ada titik yang cocok':'Mulai dari titik pertama'}</h2><p>{stops.length?'Coba nama lokasi, kota, atau status lainnya.':'Tambahkan terminal, pool, atau lokasi naik dan turun yang dilayani PO Anda.'}</p>{stops.length?<button type="button" onClick={()=>{setQuery('');setStatus('ALL');}}>Reset pencarian</button>:<button type="button" className="admin-primary" onClick={()=>openForm()}>Tambah titik</button>}</div>}
   <div className="stop-footer" role="status">Menampilkan {visible.length} dari {stops.length} titik</div>
  </section>
  <dialog ref={dialog} className="stop-dialog" aria-labelledby={prefix+'title'} onCancel={event=>{if(pending)event.preventDefault();}}><div className="stop-dialog-header"><div><p>Lokasi PO</p><h2 id={prefix+'title'}>{editing?'Edit titik':'Tambah titik'}</h2></div><button type="button" className="stop-close" aria-label="Tutup formulir" disabled={pending} onClick={closeForm}><X size={22} aria-hidden="true"/></button></div><p className="stop-dialog-description">Isi detail lokasi agar mudah ditemukan saat menyusun rute perjalanan.</p><MasterForm key={formKey} companyId={companyId} kind="stop" initial={editing} onSaved={saved} onPendingChange={setPending} onCancel={closeForm}/></dialog>
 </div>;
}
