import type {ReactNode} from 'react';
import type {Metadata} from 'next';
import PassengerShell from '@/app/components/passenger-shell';
import Link from 'next/link';
import './pengaduan.css';
export const metadata:Metadata={title:'Pusat Pengaduan | Seatpax',robots:{index:false,follow:false},referrer:'no-referrer'};
export default function ComplaintLayout({children}:{children:ReactNode}){return <PassengerShell><div className="hd"><nav className="hd-subnav" aria-label="Pusat pengaduan"><Link href="/pengaduan">Pusat pengaduan</Link><Link href="/pengaduan/buat">Buat pengaduan</Link><Link href="/pengaduan/cek">Cek pengaduan</Link></nav>{children}</div></PassengerShell>;}
