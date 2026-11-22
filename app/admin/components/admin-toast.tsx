'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { CheckCircle, WarningCircle, X } from '@phosphor-icons/react/ssr';
import {
  clearToastStorage,
  HIGHLIGHT_STORAGE_KEY,
  readToastStorage,
  TOAST_EVENT,
  TOAST_STORAGE_KEY,
  TOAST_TTL_MS,
  type AdminToastTone,
  type PendingHighlight,
  type StoredToast,
} from '../admin-toast';

type ActiveToast = {
  id: string;
  title: string;
  message?: string;
  tone: AdminToastTone;
  durationMs: number;
};

const ROW_HIGHLIGHT_MS = 4_200;

function findTargetRow(root: HTMLElement, target: PendingHighlight): HTMLTableRowElement | null {
  const rows = root.querySelectorAll<HTMLTableRowElement>('tr[data-row-id], tr[data-row-name]');
  if (target.id) {
    for (const row of rows) {
      if (row.dataset.rowId === target.id) return row;
    }
  }
  if (target.name) {
    const needle = target.name.trim().toLocaleLowerCase('id-ID');
    for (const row of rows) {
      if ((row.dataset.rowName ?? '').trim().toLocaleLowerCase('id-ID') === needle) return row;
    }
  }
  return null;
}

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ActiveToast;
  onDismiss: (id: string) => void;
}) {
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const timer = window.setTimeout(() => onDismiss(toast.id), toast.durationMs);
    return () => window.clearTimeout(timer);
  }, [paused, toast.durationMs, toast.id, onDismiss]);

  return (
    <div
      className={`admin-toast is-${toast.tone}`}
      role={toast.tone === 'error' ? 'alert' : 'status'}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <span className="admin-toast-icon" aria-hidden="true">
        {toast.tone === 'error' ? (
          <WarningCircle size={20} weight="fill" />
        ) : (
          <CheckCircle size={20} weight="fill" />
        )}
      </span>
      <div className="admin-toast-body">
        <strong>{toast.title}</strong>
        {toast.message && <p>{toast.message}</p>}
      </div>
      <button
        type="button"
        className="admin-toast-close"
        aria-label="Tutup notifikasi"
        onClick={() => onDismiss(toast.id)}
      >
        <X size={16} weight="bold" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Floating viewport anchored inside AdminShell for temporary Admin PO notifications
 * and post-save/post-redirect table row highlighting.
 */
export default function AdminToastViewport() {
  const pathname = usePathname();
  const [toasts, setToasts] = useState<ActiveToast[]>([]);
  const highlightTimers = useRef<number[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts(current => current.filter(item => item.id !== id));
  }, []);

  const showToast = useCallback((stored: StoredToast) => {
    clearToastStorage(TOAST_STORAGE_KEY);
    const tone: AdminToastTone = stored.tone === 'error' ? 'error' : 'ok';
    const next: ActiveToast = {
      id: stored.id,
      title: stored.title,
      message: stored.message,
      tone,
      durationMs: stored.durationMs ?? (tone === 'error' ? 6_500 : 4_500),
    };
    setToasts(current => {
      if (current.some(item => item.id === next.id)) return current;
      return [...current.slice(-1), next];
    });
  }, []);

  const tryApplyHighlight = useCallback(() => {
    const pending = readToastStorage<PendingHighlight>(HIGHLIGHT_STORAGE_KEY);
    if (!pending) return;
    if (Date.now() > pending.expiresAt) {
      clearToastStorage(HIGHLIGHT_STORAGE_KEY);
      return;
    }
    const root = document.getElementById('admin-main');
    if (!root) return;
    const row = findTargetRow(root, pending);
    if (!row) return;

    clearToastStorage(HIGHLIGHT_STORAGE_KEY);
    row.classList.remove('admin-row-highlight');
    // Force reflow so re-editing the same row replays the highlight transition cleanly.
    void row.offsetWidth;
    row.classList.add('admin-row-highlight');
    if (typeof row.scrollIntoView === 'function') {
      row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    const timer = window.setTimeout(() => {
      row.classList.remove('admin-row-highlight');
    }, ROW_HIGHLIGHT_MS);
    highlightTimers.current.push(timer);
  }, []);

  useEffect(() => {
    const pending = readToastStorage<StoredToast>(TOAST_STORAGE_KEY);
    if (pending) {
      if (Date.now() - pending.createdAt <= TOAST_TTL_MS) {
        const frame = window.requestAnimationFrame(() => showToast(pending));
        return () => window.cancelAnimationFrame(frame);
      } else {
        clearToastStorage(TOAST_STORAGE_KEY);
      }
    }
  }, [showToast]);

  useEffect(() => {
    const onToast = (event: Event) => {
      const custom = event as CustomEvent<StoredToast>;
      if (!custom.detail) return;
      showToast(custom.detail);
      window.requestAnimationFrame(() => tryApplyHighlight());
    };
    window.addEventListener(TOAST_EVENT, onToast);
    return () => window.removeEventListener(TOAST_EVENT, onToast);
  }, [showToast, tryApplyHighlight]);

  useEffect(() => {
    const main = document.getElementById('admin-main');
    const raf = window.requestAnimationFrame(() => tryApplyHighlight());
    if (!main || typeof MutationObserver === 'undefined') {
      return () => window.cancelAnimationFrame(raf);
    }
    const observer = new MutationObserver(() => tryApplyHighlight());
    observer.observe(main, { childList: true, subtree: true });
    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [pathname, tryApplyHighlight]);

  useEffect(
    () => () => {
      for (const timer of highlightTimers.current) window.clearTimeout(timer);
      highlightTimers.current = [];
    },
    [],
  );

  if (!toasts.length) return null;

  return (
    <div className="admin-toast-viewport" aria-live="polite" aria-label="Notifikasi sistem">
      {toasts.map(toast => (
        <ToastCard key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  );
}
