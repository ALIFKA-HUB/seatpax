'use client';

import type { ReactNode } from 'react';
import { useState, useTransition } from 'react';

type Props = {
  className?: string;
  errorClassName?: string;
  ariaLabel?: string;
  idleContent: ReactNode;
  pendingContent?: ReactNode;
};

/** Terminates the current local session directly without leaving the workspace. */
export default function SessionLogoutButton({
  className,
  errorClassName,
  ariaLabel,
  idleContent,
  pendingContent,
}: Props) {
  const [message, setMessage] = useState('');
  const [pending, startTransition] = useTransition();

  function handleLogout() {
    setMessage('');
    startTransition(async () => {
      try {
        const { logoutAction } = await import('@/app/login/actions');
        const result = await logoutAction();
        if (!result.ok) setMessage(result.message);
      } catch {
        setMessage('Belum bisa keluar. Coba lagi.');
      }
    });
  }

  return (
    <>
      <button
        type="button"
        className={className}
        aria-label={ariaLabel}
        disabled={pending}
        onClick={handleLogout}
      >
        {pending ? (pendingContent ?? 'Keluar…') : idleContent}
      </button>
      {message && (
        <p className={errorClassName} role="status" aria-live="polite">
          {message}
        </p>
      )}
    </>
  );
}
