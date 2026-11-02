import type {ReactNode} from 'react';
import Link from 'next/link';
import {Inter} from 'next/font/google';
import {ArrowUpRight} from '@phosphor-icons/react/dist/ssr/ArrowUpRight';
import {UserCircle} from '@phosphor-icons/react/dist/ssr/UserCircle';
import InternalNavigation from './internal-navigation';
import '../super-admin.css';
const inter=Inter({subsets:['latin'],weight:['400','500','600','700'],variable:'--font-internal-inter',display:'swap'});
export default function SuperAdminShell({children}:{children:ReactNode}) {
 return <div className={`super-admin-shell ${inter.variable}`}>
  <a className="super-skip" href="#super-admin-main">Lewati ke konten</a>
  <InternalNavigation/>
  <div className="super-workspace">
   <header className="super-header">
    <div className="super-breadcrumb"><span>Panel internal</span><span aria-hidden="true">/</span><strong>Perusahaan</strong></div>
    <Link className="super-account" href="/account"><UserCircle size={20} aria-hidden="true"/><span>Akun & keluar</span><ArrowUpRight size={16} aria-hidden="true"/></Link>
   </header>
   <main id="super-admin-main" tabIndex={-1}>{children}</main>
  </div>
 </div>;
}
