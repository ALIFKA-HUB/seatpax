import { z } from 'zod';

export const EMAIL_OTP_LENGTH = 8; // Verified in hosted Email provider, 6 October 2026.
export type AuthResult = { ok: true } | { ok: false; code: 'invalid_email' | 'invalid_code' | 'rate_limited' | 'verification_failed' | 'provider_unavailable'; message: string };
type ProviderResult = { error: null | { code?: string; status?: number } };
export interface AuthGateway {
  request(email: string): Promise<ProviderResult>;
  verify(email: string, token: string): Promise<ProviderResult>;
  logout(): Promise<ProviderResult>;
}
const emailSchema = z.string().trim().max(254).pipe(z.email());
const invalidEmail: AuthResult = { ok: false, code: 'invalid_email', message: 'Masukkan alamat email yang valid.' };
const unavailable: AuthResult = { ok: false, code: 'provider_unavailable', message: 'Layanan login belum dapat diakses. Coba lagi sebentar.' };

async function callProvider(operation: () => Promise<ProviderResult>): Promise<AuthResult> {
  try {
    const { error } = await operation();
    if (!error) return { ok: true };
    if (error.status === 429 || ['over_email_send_rate_limit', 'over_request_rate_limit'].includes(error.code ?? '')) {
      return { ok: false, code: 'rate_limited', message: 'Terlalu banyak permintaan. Tunggu sebelum mencoba lagi.' };
    }
    if (['otp_expired', 'invalid_credentials'].includes(error.code ?? '')) {
      return { ok: false, code: 'verification_failed', message: 'Kode tidak valid atau kedaluwarsa. Silakan kirim ulang kode.' };
    }
    return unavailable;
  } catch { return unavailable; }
}
export async function requestOtp(gateway: AuthGateway, email: unknown): Promise<AuthResult> {
  const parsed = emailSchema.safeParse(email);
  return parsed.success ? callProvider(() => gateway.request(parsed.data)) : invalidEmail;
}
export async function verifyEmailOtp(gateway: AuthGateway, input: { email: unknown; token: unknown }, otpLength: number): Promise<AuthResult> {
  const parsed = emailSchema.safeParse(input?.email);
  if (!parsed.success) return invalidEmail;
  if (typeof input.token !== 'string' || !new RegExp(`^\\d{${otpLength}}$`).test(input.token)) {
    return { ok: false, code: 'invalid_code', message: `Masukkan kode ${otpLength} digit dari email.` };
  }
  return callProvider(() => gateway.verify(parsed.data, input.token as string));
}
export async function logoutSession(gateway: AuthGateway): Promise<AuthResult> {
  return callProvider(() => gateway.logout());
}
