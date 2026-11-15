'use client';
import { useActionState, useEffect, useId, useRef, useState } from 'react';
import { CaretDown, Check, UserCircle } from '@phosphor-icons/react';
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
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const listboxId = useId();

  const selected = accounts.find(a => a.id === selectedId) ?? accounts[0];
  const statusTone = state.message ? 'error' : pending ? 'pending' : 'idle';

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  function moveSelection(delta: number) {
    const idx = Math.max(0, accounts.findIndex(a => a.id === selectedId));
    const nextIdx = (idx + delta + accounts.length) % accounts.length;
    setSelectedId(accounts[nextIdx].id);
  }

  return (
    <form className="lg-form" action={action}>
      <input type="hidden" name="account" value={selectedId} />
      {next && <input type="hidden" name="next" value={next} />}

      <div className="lg-field" ref={wrapperRef}>
        <span id={labelId} className="lg-field-label">
          Akun testing
        </span>
        <div className="lg-dropdown">
          <button
            ref={triggerRef}
            type="button"
            className="lg-dropdown-trigger"
            aria-labelledby={labelId}
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={listboxId}
            disabled={pending}
            onClick={() => setOpen(prev => !prev)}
            onKeyDown={event => {
              if (event.key === 'ArrowDown') {
                event.preventDefault();
                if (!open) setOpen(true);
                else moveSelection(1);
              } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                if (!open) setOpen(true);
                else moveSelection(-1);
              }
            }}
          >
            <span className="lg-dropdown-trigger-main">
              <UserCircle size={20} weight="regular" aria-hidden="true" />
              <span className="lg-dropdown-value">
                <strong>{selected?.label ?? 'Pilih akun'}</strong>
                <span>{selected?.email ?? ''}</span>
              </span>
            </span>
            <span className="lg-dropdown-caret" aria-hidden="true">
              <CaretDown size={16} weight="bold" />
            </span>
          </button>

          {open && (
            <ul id={listboxId} role="listbox" aria-labelledby={labelId} className="lg-dropdown-menu">
              {accounts.map(account => {
                const isSelected = account.id === selectedId;
                return (
                  <li key={account.id} role="presentation">
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      className="lg-dropdown-option"
                      onClick={() => {
                        setSelectedId(account.id);
                        setOpen(false);
                        triggerRef.current?.focus();
                      }}
                    >
                      <span className="lg-dropdown-option-text">
                        <strong>{account.label}</strong>
                        <span>{account.email}</span>
                      </span>
                      {isSelected && <Check size={16} weight="bold" className="lg-dropdown-check" aria-hidden="true" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <button type="submit" className="lg-primary auth-primary" disabled={pending}>
        {pending ? 'Membuka akun...' : 'Masuk'}
      </button>

      <p role="status" aria-live="polite" className="auth-message lg-status" data-tone={statusTone}>
        {state.message || (pending ? 'Membuka sesi testing…' : '')}
      </p>
    </form>
  );
}
