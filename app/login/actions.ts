'use server';
import { redirect } from 'next/navigation';
import {safeReturnPath} from '@/modules/auth/return-path';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { EMAIL_OTP_LENGTH, requestOtp, verifyEmailOtp, logoutSession, type AuthGateway } from '@/modules/auth/service';

function gateway(): AuthGateway {
  const client = () => createServerSupabaseClient({ cookieMode: 'read-write' });
  return {
    request: async email => (await client()).auth.signInWithOtp({ email, options: { shouldCreateUser: true } }),
    verify: async (email, token) => (await client()).auth.verifyOtp({ email, token, type: 'email' }),
    logout: async () => (await client()).auth.signOut({ scope: 'local' }),
  };
}
export async function sendOtpAction(email: string) { return requestOtp(gateway(), email); }
export async function verifyOtpAction(input: { email: string; token: string }, next?:string) {
  const result = await verifyEmailOtp(gateway(), input, EMAIL_OTP_LENGTH);
  if (result.ok) redirect(safeReturnPath(next));
  return result;
}
export async function logoutAction() {
  const result = await logoutSession(gateway());
  if (result.ok) redirect('/login');
  return result;
}
