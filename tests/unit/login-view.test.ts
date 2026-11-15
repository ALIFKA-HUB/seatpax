import { describe, it, expect, vi } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import LoginForm from '@/app/login/login-form';
import DevLoginForm from '@/app/login/dev-login-form';
import { quickLoginAccounts } from '@/modules/auth/dev-login-policy';

vi.mock('@/app/login/actions', () => ({
  sendOtpAction: vi.fn(),
  verifyOtpAction: vi.fn(),
}));
vi.mock('@/app/login/dev-actions', () => ({
  quickLoginAction: vi.fn(),
}));

describe('login view contracts', () => {
  it('renders email stage with 8-digit OTP guidance and accessible controls', () => {
    const html = render(h(LoginForm, { next: '/tickets' }));
    expect(html).toContain('Langkah 1 dari 2');
    expect(html).toContain('Alamat email');
    expect(html).toContain('Kirim kode masuk');
    expect(html).toContain('8 digit');
    expect(html).toContain('auth-message');
  });

  it('renders dev quick login with role chips, account select, and destination preview', () => {
    const html = render(h(DevLoginForm, { accounts: quickLoginAccounts, next: '/trips' }));
    expect(html).toContain('Akun testing');
    expect(html).toContain('Masuk tanpa OTP');
    expect(html).toContain('auth-message');
    expect(html).toContain('Tujuan masuk');
    expect(html).toContain('/trips');
    for (const account of quickLoginAccounts) {
      expect(html).toContain(account.label);
    }
  });
});
