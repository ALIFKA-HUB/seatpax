import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getVerifiedUser} from '@/modules/auth/identity';
import {listEntryWorkspaces} from '@/modules/auth/entry-destination';
import PassengerShell from '../components/passenger-shell';
import StatePanel from '../components/state-panel';
export const dynamic='force-dynamic';
export default async function WorkspacesPage(){
 const user=await getVerifiedUser();
 if(!user)redirect('/login');
 let workspaces:Awaited<ReturnType<typeof listEntryWorkspaces>>;
 try{workspaces=await listEntryWorkspaces(user.id);}catch{return <PassengerShell focused><StatePanel title="Workspace belum dapat dimuat" action={<Link href="/workspaces" className="sp-secondary">Coba lagi</Link>}><p>Periksa koneksi dan coba lagi sebentar.</p></StatePanel></PassengerShell>;}
 return <PassengerShell focused><div className="auth-shell"><section className="auth-card" aria-labelledby="workspace-title"><p className="eyebrow">Workspace Seatpax</p><h1 id="workspace-title">Mau masuk ke mana?</h1><p className="sp-muted">Pilih area kerja yang ingin Anda buka.</p><div className="sp-account-actions">{workspaces.map(item=><Link key={item.href} href={item.href}>{item.label} →</Link>)}<Link href="/trips">Lihat perjalanan sebagai pelanggan →</Link><Link href="/account">Kelola akun →</Link></div></section></div></PassengerShell>;
}
