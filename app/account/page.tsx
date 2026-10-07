import Link from 'next/link';
import {redirect} from 'next/navigation';
import {getVerifiedUser} from '@/modules/auth/identity';
import LogoutForm from './logout-form';
import {ensureVerifiedProfile} from '@/modules/access/server';
export const dynamic='force-dynamic';
export default async function AccountPage(){
 const user=await getVerifiedUser();if(!user)redirect('/login');
 await ensureVerifiedProfile();
 return <main className="auth-shell"><Link href="/" className="auth-brand">SEATPAX</Link><section className="auth-card" aria-labelledby="account-title"><p className="eyebrow">Akun penumpang</p><h1 id="account-title">Anda sudah masuk</h1><p className="auth-intro">Email akun</p><p className="auth-email">{user.email}</p><LogoutForm /></section></main>;
}
