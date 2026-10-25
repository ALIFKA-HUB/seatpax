import type {ReactNode} from 'react';
import type {Metadata} from 'next';
import PassengerShell from '@/app/components/passenger-shell';
import './pengaduan.css';
export const metadata:Metadata={title:'Pusat Pengaduan | Seatpax',robots:{index:false,follow:false},referrer:'no-referrer'};
export default function ComplaintLayout({children}:{children:ReactNode}){return <PassengerShell complaints><div className="hd hd-public">{children}</div></PassengerShell>;}
