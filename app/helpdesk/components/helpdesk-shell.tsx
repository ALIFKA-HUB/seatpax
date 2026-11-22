'use client';
import {useEffect,useRef,useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {ArrowSquareOut} from '@phosphor-icons/react/dist/csr/ArrowSquareOut';
import {ClipboardText} from '@phosphor-icons/react/dist/csr/ClipboardText';
import {List} from '@phosphor-icons/react/dist/csr/List';
import {SignOut} from '@phosphor-icons/react/dist/csr/SignOut';
import {SquaresFour} from '@phosphor-icons/react/dist/csr/SquaresFour';
import {X} from '@phosphor-icons/react/dist/csr/X';
import Brand from '@/app/components/brand';
import SessionLogoutButton from '@/app/components/session-logout-button';
import ThemeToggle from '@/app/components/theme-toggle';

export default function HelpdeskShell({children}:{children:React.ReactNode}){
 const pathname=usePathname(),[open,setOpen]=useState(false),toggleRef=useRef<HTMLButtonElement>(null);
 useEffect(()=>{if(!open)return;const onKey=(event:KeyboardEvent)=>{if(event.key==='Escape'){setOpen(false);toggleRef.current?.focus();}};window.addEventListener('keydown',onKey);return()=>window.removeEventListener('keydown',onKey);},[open]);
 const nav=<><nav className="hd-side-nav" aria-label="Navigasi Helpdesk">
  <Link href="/helpdesk" onClick={()=>setOpen(false)} aria-current={pathname==='/helpdesk'?'page':undefined}><SquaresFour size={20} weight="regular" aria-hidden="true"/><span>Dashboard</span></Link>
  <Link href="/helpdesk/pengaduan" onClick={()=>setOpen(false)} aria-current={pathname.startsWith('/helpdesk/pengaduan')||/^\/helpdesk\/[^/]+/.test(pathname)?'page':undefined}><ClipboardText size={20} weight="regular" aria-hidden="true"/><span>Pengaduan</span></Link>
 </nav><div className="hd-side-bottom"><Link href="/"><ArrowSquareOut size={18} aria-hidden="true"/><span>Ke Seatpax</span></Link><ThemeToggle showLabel fullLabel/><SessionLogoutButton className="hd-logout-btn" errorClassName="hd-logout-error" idleContent={<><SignOut size={18} aria-hidden="true"/><span>Keluar dari akun</span></>} pendingContent={<><SignOut size={18} aria-hidden="true"/><span>Keluar…</span></>}/></div></>;
 return <div className="hd-workspace"><aside className="hd-sidebar"><Brand href="/helpdesk" darkAware/>{nav}</aside><div className="hd-workarea"><header className="hd-mobile-bar"><Brand href="/helpdesk" darkAware/><button ref={toggleRef} type="button" aria-expanded={open} aria-controls="hd-mobile-navigation" aria-label={open?'Tutup navigasi':'Buka navigasi'} onClick={()=>setOpen(!open)}>{open?<X size={22}/>:<List size={22}/>}</button></header>{open&&<div className="hd-mobile-nav" id="hd-mobile-navigation">{nav}</div>}<main className="hd-main">{children}</main></div></div>;
}
