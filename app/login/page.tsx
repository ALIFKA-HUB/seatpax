import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getVerifiedUser } from '@/modules/auth/identity';
import LoginForm from './login-form';
import {safeReturnPath} from '@/modules/auth/return-path';
export const dynamic = 'force-dynamic';
export default async function LoginPage({searchParams}:{searchParams:Promise<{next?:string}>}) {
  const next=safeReturnPath((await searchParams).next);
  if (await getVerifiedUser()) redirect(next);
  return <main className="auth-shell"><Link href="/" className="auth-brand">SEATPAX</Link><section className="auth-card" aria-labelledby="login-title"><p className="eyebrow">Akun penumpang</p><h1 id="login-title">Masuk dengan email</h1><p className="auth-intro">Gunakan kode dari email untuk masuk dan mengakses akun Anda.</p><LoginForm next={next} /><p className="auth-note">Jangan bagikan kode masuk kepada siapa pun.</p></section><p className="auth-footer">Seatpax · Perjalanan lebih teratur</p></main>;
}
