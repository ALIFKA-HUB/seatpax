import Link from 'next/link';
import type {ReactNode} from 'react';
import {SignOut} from '@phosphor-icons/react/dist/ssr/SignOut';
import Brand from '@/app/components/brand';
import SessionLogoutButton from '@/app/components/session-logout-button';
import ThemeToggle from '@/app/components/theme-toggle';
export default function CrewShell({children}:{children:ReactNode}) {
 return <div className="crew-shell"><a className="crew-skip" href="#crew-main">Lewati ke konten</a>
  <header className="crew-topbar"><div className="crew-topbar-inner"><div className="crew-identity"><Brand href="/crew"/><span className="crew-role">Crew</span></div>
   <nav aria-label="Navigasi crew"><Link href="/crew">Perjalanan saya</Link><ThemeToggle className="crew-theme-toggle" showLabel/><SessionLogoutButton className="crew-nav-logout" errorClassName="crew-nav-error" idleContent={<><SignOut size={18} aria-hidden="true"/><span>Keluar</span></>} pendingContent={<><SignOut size={18} aria-hidden="true"/><span>Keluar…</span></>}/></nav>
  </div></header><main className="crew-main" id="crew-main" tabIndex={-1}>{children}</main></div>;
}
