import type {ReactNode} from 'react';
import Link from 'next/link';
import Brand from '@/app/components/brand';
import '../super-admin.css';
export default function SuperAdminShell({children}:{children:ReactNode}) {
 return <div className="super-admin-shell"><a className="super-skip" href="#super-admin-main">Lewati ke konten</a><header className="super-header"><Brand href="/super-admin/companies"/><span>Super Admin</span><Link href="/account">Akun & keluar</Link></header><main id="super-admin-main" tabIndex={-1}>{children}</main></div>;
}