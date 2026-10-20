import {redirect} from 'next/navigation';
import {getVerifiedUser} from '@/modules/auth/identity';
import LoginForm from './login-form';
import {validatedReturnPath} from '@/modules/auth/return-path';
import {resolveEntryDestination} from '@/modules/auth/entry-destination';
import StatePanel from '../components/state-panel';
import Link from 'next/link';
import PassengerShell from '../components/passenger-shell';
export const dynamic='force-dynamic';
export default async function LoginPage({searchParams}:{searchParams:Promise<{next?:string}>}){
 const next=validatedReturnPath((await searchParams).next)??undefined;
 const user=await getVerifiedUser();
 if(user){
  let destination:string;
  try{destination=await resolveEntryDestination(user.id,next);}catch{return <PassengerShell focused><StatePanel title="Halaman tujuan belum dapat dimuat" action={<Link className="sp-secondary" href="/login">Coba lagi</Link>}><p>Koneksi akun sedang bermasalah. Coba lagi sebentar.</p></StatePanel></PassengerShell>;}
  redirect(destination);
 }
 return <PassengerShell focused><div className="auth-shell"><section className="auth-card" aria-labelledby="login-title"><p className="eyebrow">Akun penumpang</p><h1 id="login-title">Masuk dengan email</h1><p className="auth-intro">Gunakan kode dari email untuk masuk dan mengakses akun Anda.</p><LoginForm next={next}/><p className="auth-note">Jangan bagikan kode masuk kepada siapa pun.</p></section></div></PassengerShell>;
}
