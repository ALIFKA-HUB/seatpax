import type {ReactNode} from 'react';
import {Inter} from 'next/font/google';
import {SignOut} from '@phosphor-icons/react/dist/ssr/SignOut';
import SessionLogoutButton from '@/app/components/session-logout-button';
import ThemeToggle from '@/app/components/theme-toggle';
import InternalNavigation from './internal-navigation';
import '../super-admin.css';
import '@/app/styles/ops-dark.css';
const inter=Inter({subsets:['latin'],weight:['400','500','600','700'],variable:'--font-internal-inter',display:'swap'});
export default function SuperAdminShell({children,section='companies'}:{children:ReactNode;section?:'dashboard'|'companies'}) {
 return <div className={`super-admin-shell ${inter.variable}`}>
  <a className="super-skip" href="#super-admin-main">Lewati ke konten</a>
  <InternalNavigation section={section}/>
  <div className="super-workspace">
   <header className="super-header">
    <div className="super-breadcrumb"><span>Panel internal</span><span aria-hidden="true">/</span><strong>{section==='dashboard'?'Dashboard':'Perusahaan'}</strong></div>
    <div className="super-header-actions">
     <ThemeToggle className="super-theme-toggle" showLabel/>
     <div className="super-account-wrap">
      <SessionLogoutButton
       className="super-account"
       errorClassName="super-account-error"
       idleContent={<><SignOut size={18} aria-hidden="true"/><span>Keluar</span></>}
       pendingContent={<><SignOut size={18} aria-hidden="true"/><span>Keluar…</span></>}
      />
     </div>
    </div>
   </header>
   <main id="super-admin-main" tabIndex={-1}>{children}</main>
  </div>
 </div>;
}
