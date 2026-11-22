'use client';

import { useCallback, useRef, useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { Moon } from '@phosphor-icons/react/dist/csr/Moon';
import { Sun } from '@phosphor-icons/react/dist/csr/Sun';
import {
  THEME_CHANGE_EVENT,
  THEME_STORAGE_KEY,
  applyThemeTransition,
  nextThemeMode,
  readClientThemeMode,
  type ThemeMode,
} from './theme-mode';

function subscribe(callback: () => void) {
  function onStorage(event: StorageEvent) {
    if (!event.key || event.key === THEME_STORAGE_KEY) callback();
  }
  window.addEventListener(THEME_CHANGE_EVENT, callback);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, callback);
    window.removeEventListener('storage', onStorage);
  };
}

function serverSnapshot(): ThemeMode {
  return 'light';
}

type Props = {
  className?: string;
  showLabel?: boolean;
  fullLabel?: boolean;
};

/** Circular-reveal Light/Dark theme switch for operational workspaces and Crew PWA. */
export default function ThemeToggle({ className, showLabel = false, fullLabel = false }: Props) {
  const mode = useSyncExternalStore(subscribe, readClientThemeMode, serverSnapshot);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const busyRef = useRef(false);

  const handleToggle = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (busyRef.current) return;
      busyRef.current = true;
      const target = nextThemeMode(mode);
      void applyThemeTransition({
        target,
        button: buttonRef.current,
        point: { clientX: event.clientX, clientY: event.clientY },
        wrapSync: flushSync,
        onSyncCommit: () => {},
      }).finally(() => {
        busyRef.current = false;
      });
    },
    [mode],
  );

  const isDark = mode === 'dark';
  const label = isDark ? 'Mode terang' : 'Mode gelap';
  const visibleLabel = fullLabel ? label : isDark ? 'Terang' : 'Gelap';

  return (
    <button
      ref={buttonRef}
      type="button"
      className={className ? `ops-theme-toggle ${className}` : 'ops-theme-toggle'}
      aria-pressed={isDark}
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      title={label}
      onClick={handleToggle}
    >
      {isDark ? <Sun size={18} weight="regular" aria-hidden="true" /> : <Moon size={18} weight="regular" aria-hidden="true" />}
      {showLabel && <span>{visibleLabel}</span>}
    </button>
  );
}
