import Link from 'next/link';
import type {ReactNode} from 'react';
import Brand from '@/app/components/brand';
import AdminNavigation from './admin-navigation';
export default function AdminShell({companyId,companyName,children}:{companyId:string;companyName:string;children:ReactNode}) {
 return <div className="admin-shell"><a className="admin-skip" href="#admin-main">Lewati ke konten</a><aside className="admin-sidebar"><div className="admin-brand"><Brand href="/admin"/></div><div className="admin-company"><p>Admin PO</p><strong>{companyName}</strong></div><AdminNavigation base={`/admin/companies/${companyId}`}/><Link href="/account" className="admin-account">Akun & keluar</Link></aside><main className="admin-main" id="admin-main" tabIndex={-1}>{children}</main></div>;
}
