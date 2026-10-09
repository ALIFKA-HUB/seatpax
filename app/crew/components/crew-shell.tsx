import Link from 'next/link';
import type {ReactNode} from 'react';
import Brand from '@/app/components/brand';
export default function CrewShell({children}:{children:ReactNode}) {
 return <div className="crew-shell"><a className="crew-skip" href="#crew-main">Lewati ke konten</a>
  <header className="crew-topbar"><div className="crew-topbar-inner"><div className="crew-identity"><Brand href="/crew"/><span className="crew-role">Crew</span></div>
   <nav aria-label="Navigasi crew"><Link href="/crew">Perjalanan saya</Link><Link href="/account">Akun & keluar</Link></nav>
  </div></header><main className="crew-main" id="crew-main" tabIndex={-1}>{children}</main></div>;
}
