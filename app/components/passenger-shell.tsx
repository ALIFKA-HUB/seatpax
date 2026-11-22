import Link from 'next/link';
import type {ReactNode} from 'react';
import Brand from './brand';
import PassengerAccountMenu from './passenger-account-menu';
import PassengerHeader from './passenger-header';
import PassengerFooter from './passenger-footer';
import ComplaintEntry from './complaint-entry';
import ComplaintNavigation from '../pengaduan/components/complaint-navigation';
import SectionNavigation from '../landing/section-navigation';
import {ArrowUpRight} from '@phosphor-icons/react/dist/ssr/ArrowUpRight';
import {MapTrifold} from '@phosphor-icons/react/dist/ssr/MapTrifold';
import {Ticket} from '@phosphor-icons/react/dist/ssr/Ticket';
import '../passenger.css';
import './passenger-navigation.css';
export default function PassengerShell({children,active,focused=false,landing=false,complaints=false}:{children:ReactNode;active?:'search'|'tickets';focused?:boolean;landing?:boolean;complaints?:boolean}) {
 const links=[['search','/trips','Perjalanan',MapTrifold],['tickets','/tickets','Pesanan saya',Ticket]] as const;
 return <div className={`passenger-shell${focused?' sp-focused':''}${landing?' sp-landing':''}${complaints?' sp-complaints':''}`}>
  <a className="sp-skip" href="#passenger-content">Langsung ke konten</a>
  <PassengerHeader animated={!focused}><Brand href={complaints?'/pengaduan':'/'}/>{!focused&&<>{complaints?<ComplaintNavigation/>:landing?<SectionNavigation/>:<nav aria-label="Navigasi penumpang">{links.map(([key,path,label,Icon])=><Link key={key} href={path} aria-current={active===key?'page':undefined}><Icon size={21} aria-hidden="true"/><span>{label}</span></Link>)}</nav>}<div className={`sp-header-account${landing?' lp-header-actions':''}`}>{landing&&<Link className="lp-header-orders" href="/tickets" aria-label="Pesanan saya"><Ticket size={21} aria-hidden="true"/></Link>}{complaints?<Link className="hd-back-to-seatpax" href="/"><span>Ke Seatpax</span><ArrowUpRight size={17} weight="light" aria-hidden="true"/></Link>:<PassengerAccountMenu/>}</div></>}</PassengerHeader>
  <main id="passenger-content" className="passenger">{children}</main>
  {!focused&&<ComplaintEntry/>}
  {focused?<footer className="sp-footer"><span>Seatpax</span><span>Perjalanan antarkota, lebih teratur.</span></footer>:<PassengerFooter/>}
 </div>;
}
