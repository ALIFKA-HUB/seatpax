'use client';
import { useActionState, useState } from 'react';
import { ArrowRight, UserCircle } from '@phosphor-icons/react';
import { quickLoginAction } from './dev-actions';

type QuickAccount = {
  id: string;
  label: string;
  email: string;
  href: string;
};

export default function DevLoginForm({ accounts, next }: { accounts: readonly QuickAccount[]; next?: string }) {
  const [state, action, pending] = useActionState(quickLoginAction, { message: '' });
  const defaultAccount = accounts.find(a => a.id === 'customer')?.id ?? accounts[0]?.id ?? '';
  const [selectedId, setSelectedId] = useState(defaultAccount);
  const selected = accounts.find(a => a.id === selectedId) ?? accounts[0];
  const statusTone = state.message ? 'error' : pending ? 'pending' : 'idle';

  return (
    <form className="lg-form" action={action}>
      <div className="lg-role-chips" role="group" aria-label="Pilih cepat peran testing">
        {accounts.map(account => (
          <button
            key={account.id}
            type="button"
            className="lg-role-chip"
            aria-pressed={selectedId === account.id}
            disabled={pending}
            onClick={() => setSelectedId(account.id)}
          >
            {account.label}
          </button>
        ))}
      </div>

      <div className="lg-field">
        <label htmlFor="testing-account">Akun testing</label>
        <div className="lg-select-box">
          <span className="lg-input-icon" aria-hidden="true">
            <UserCircle size={18} weight="regular" />
          </span>
          <select
            id="testing-account"
            name="account"
            value={selectedId}
            onChange={event => setSelectedId(event.target.value)}
            disabled={pending}
            required
          >
            {accounts.map(a => (
              <option key={a.id} value={a.id}>
                {a.label} | {a.email}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selected && (
        <div className="lg-role-preview">
          <span>Tujuan masuk</span>
          <code>{next && selected.id === 'customer' ? next : selected.href}</code>
        </div>
      )}

      {next && <input type="hidden" name="next" value={next} />}

      <button type="submit" className="lg-primary auth-primary" disabled={pending}>
        <span>{pending ? 'Membuka akun...' : 'Masuk tanpa OTP'}</span>
        {!pending && <ArrowRight size={18} weight="bold" aria-hidden="true" />}
      </button>

      <p role="status" aria-live="polite" className="auth-message lg-status" data-tone={statusTone}>
        {state.message || (pending ? 'Membuka sesi testing…' : '')}
      </p>
    </form>
  );
}
