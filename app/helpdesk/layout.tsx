import type {ReactNode} from 'react';
import Brand from '@/app/components/brand';
import Link from 'next/link';
import '../pengaduan/pengaduan.css';
export const metadata={title:'Helpdesk | Seatpax',robots:{index:false,follow:false}};
export const dynamic='force-dynamic';
export default function HelpdeskLayout({children}:{children:ReactNode}){return <div className="hd-staff-page"><header className="hd-staff-header"><Brand href="/helpdesk"/><nav aria-label="Navigasi Helpdesk"><Link href="/helpdesk">Daftar pengaduan</Link><Link href="/account">Akun & keluar</Link></nav></header><main className="hd">{children}</main></div>;}
