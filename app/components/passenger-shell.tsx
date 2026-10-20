import Link from 'next/link';
import type {ReactNode} from 'react';
import Brand from './brand';
import {MapTrifold,Ticket,UserCircle} from '@phosphor-icons/react/ssr';
import '../passenger.css';
export default function PassengerShell({children,active,focused=false}:{children:ReactNode;active?:'search'|'tickets'|'account';focused?:boolean}) {
 const links=[['search','/trips','Perjalanan',MapTrifold],['tickets','/tickets','Pesanan saya',Ticket],['account','/account','Akun',UserCircle]] as const;
 return <div className={`passenger-shell${focused?' sp-focused':''}`}>
  <a className="sp-skip" href="#passenger-content">Langsung ke konten</a>
  <header className="sp-header"><div className="sp-header-inner"><Brand/>{!focused&&<nav aria-label="Navigasi penumpang">{links.map(([key,path,label,Icon])=><Link key={key} href={path} aria-current={active===key?'page':undefined}><Icon size={21} aria-hidden="true"/><span>{label}</span></Link>)}</nav>}</div></header>
  <main id="passenger-content" className="passenger">{children}</main>
  <footer className="sp-footer"><span>Seatpax</span><span>Perjalanan antarkota, lebih teratur.</span></footer>
 </div>;
}
