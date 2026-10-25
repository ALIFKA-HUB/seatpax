import Link from 'next/link';
import type {ReactNode} from 'react';
import Brand from '@/app/components/brand';
import AdminNavigation from './admin-navigation';
import {CaretRight, UserCircle} from '@phosphor-icons/react/ssr';
import {Plus_Jakarta_Sans} from 'next/font/google';
const jakarta=Plus_Jakarta_Sans({subsets:['latin'],variable:'--font-jakarta',display:'swap'});
export default function AdminShell({companyId,companyName,children,complaintCount}:{companyId:string;companyName:string;children:ReactNode;complaintCount?:number}) {
 return <div className={`admin-shell ${jakarta.variable}`}><a className="admin-skip" href="#admin-main">Lewati ke konten</a><aside className="admin-sidebar"><div className="admin-brand"><Brand href="/admin"/></div><Link href="/admin" className="admin-company" aria-label={`Pilih workspace. Saat ini ${companyName}`}><span className="admin-company-avatar" aria-hidden="true">{Array.from(companyName.trim())[0]??'P'}</span><span><strong>{companyName}</strong><small>Workspace Admin PO</small></span><CaretRight size={16} aria-hidden="true"/></Link><AdminNavigation complaintCount={complaintCount} base={`/admin/companies/${companyId}`}/><Link href="/account" className="admin-account"><UserCircle size={22} aria-hidden="true"/><span>Akun & keluar<small>Kelola sesi Anda</small></span></Link></aside><main className="admin-main" id="admin-main" tabIndex={-1}>{children}</main></div>;
}
