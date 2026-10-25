'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {CalendarBlank,Path,MapPin,Bus,Armchair,Stack,CreditCard,ClipboardText} from '@phosphor-icons/react/ssr';
export function isAdminSectionActive(pathname:string,href:string):boolean {return pathname===href||pathname.startsWith(href+'/');}
export default function AdminNavigation({base,complaintCount}:{base:string;complaintCount?:number}) {
 const pathname=usePathname();const sections=[{route:'trips',label:'Perjalanan',Icon:CalendarBlank},{route:'routes',label:'Rute & tarif',Icon:Path},{route:'stops',label:'Titik naik & turun',Icon:MapPin},{route:'vehicles',label:'Armada',Icon:Bus},{route:'seat-templates',label:'Template kursi',Icon:Armchair},{route:'service-classes',label:'Kelas layanan',Icon:Stack},{route:'payment-conflicts',label:'Konflik pembayaran',Icon:CreditCard}];
 return <nav aria-label="Navigasi Admin PO"><p className="admin-nav-caption">Operasional</p>{sections.map(({route,label,Icon})=>{const href=base+'/'+route;return <Link key={route} href={href} aria-current={isAdminSectionActive(pathname,href)?'page':undefined}><Icon size={20} weight="regular" aria-hidden="true"/>{label}</Link>;})}<p className="admin-nav-caption">Pesanan</p><Link href={base+'/helpdesk'} aria-current={isAdminSectionActive(pathname,base+'/helpdesk')?'page':undefined}><ClipboardText size={20} aria-hidden="true"/>Pengaduan pelanggan{typeof complaintCount==='number'&&complaintCount>0&&<span aria-label={complaintCount+' pengaduan belum selesai'}> ({complaintCount})</span>}</Link></nav>;
}
