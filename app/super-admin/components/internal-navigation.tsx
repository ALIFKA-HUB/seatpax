'use client';

import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {Buildings} from '@phosphor-icons/react/dist/csr/Buildings';
import {CaretRight} from '@phosphor-icons/react/dist/csr/CaretRight';
import {List} from '@phosphor-icons/react/dist/csr/List';
import {ShieldCheck} from '@phosphor-icons/react/dist/csr/ShieldCheck';
import {X} from '@phosphor-icons/react/dist/csr/X';
import Brand from '@/app/components/brand';

export default function InternalNavigation(){
 const [open,setOpen]=useState(false);
 const toggle=useRef<HTMLButtonElement>(null);
 const panel=useRef<HTMLElement>(null);
 function close(){if(open){setOpen(false);toggle.current?.focus();}}

 useEffect(()=>{
  if(!open)return;
  panel.current?.querySelector<HTMLAnchorElement>('nav a')?.focus();
  function onKey(event:KeyboardEvent){if(event.key==='Escape'){setOpen(false);toggle.current?.focus();}}
  const desktop=window.matchMedia('(min-width: 961px)');
  function onBreakpoint(){setOpen(false);}
  document.addEventListener('keydown',onKey);
  desktop.addEventListener('change',onBreakpoint);
  return ()=>{document.removeEventListener('keydown',onKey);desktop.removeEventListener('change',onBreakpoint);};
 },[open]);

 return <div className={`super-navigation${open?' is-open':''}`}>
  <div className="super-mobile-bar">
   <button ref={toggle} className="super-menu-toggle" type="button" aria-label={open?'Tutup navigasi':'Buka navigasi'} aria-expanded={open} aria-controls="super-admin-navigation" onClick={()=>open?close():setOpen(true)}>{open?<X size={22} aria-hidden="true"/>:<List size={22} aria-hidden="true"/>}</button>
   <Brand href="/super-admin/companies"/>
  </div>
  <aside ref={panel} className="super-sidebar" id="super-admin-navigation">
   <div className="super-sidebar-brand"><Brand href="/super-admin/companies"/></div>
   <div className="super-identity"><span className="super-avatar" aria-hidden="true">SA</span><div><strong>Super Admin</strong><p>Panel internal Seatpax</p></div></div>
   <nav aria-label="Navigasi administrasi"><details open>
    <summary><ShieldCheck size={20} aria-hidden="true"/><span>Administrasi</span><CaretRight className="super-nav-caret" size={16} aria-hidden="true"/></summary>
    <div className="super-nav-group"><Link href="/super-admin/companies" aria-current="page" onClick={close}><Buildings size={20} aria-hidden="true"/><span>Perusahaan</span></Link></div>
   </details></nav>
   <p className="super-sidebar-note">Kelola perusahaan dan status penjualan dari satu tempat.</p>
  </aside>
 </div>;
}
