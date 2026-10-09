'use client';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
export function isAdminSectionActive(pathname:string,href:string):boolean {return pathname===href||pathname.startsWith(href+'/');}
export default function AdminNavigation({base}:{base:string}) {
 const pathname=usePathname();const sections=[['trips','Perjalanan'],['routes','Rute & tarif'],['stops','Daftar stop'],['service-classes','Kelas layanan'],['seat-templates','Template kursi'],['vehicles','Armada'],['payment-conflicts','Konflik pembayaran']];
 return <nav aria-label="Navigasi Admin PO">{sections.map(([route,label])=>{const href=base+'/'+route;return <Link key={route} href={href} aria-current={isAdminSectionActive(pathname,href)?'page':undefined}>{label}</Link>;})}</nav>;
}
