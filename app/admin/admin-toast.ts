export type AdminToastTone = 'ok' | 'error';

export type AdminToastPayload = {
  title: string;
  message?: string;
  tone?: AdminToastTone;
  highlightId?: string;
  highlightName?: string;
  durationMs?: number;
};

export type PendingHighlight = {
  id?: string;
  name?: string;
  expiresAt: number;
};

export type StoredToast = AdminToastPayload & {
  id: string;
  createdAt: number;
};

export const TOAST_STORAGE_KEY = 'seatpax.admin.toast';
export const HIGHLIGHT_STORAGE_KEY = 'seatpax.admin.highlight';
export const TOAST_EVENT = 'seatpax:admin-toast';
export const TOAST_TTL_MS = 15_000;
export const HIGHLIGHT_TTL_MS = 10_000;

export function readToastStorage<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export function clearToastStorage(key: string) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(key);
  } catch {
    // Ignore storage restrictions.
  }
}

function writeToastStorage(key: string, value: unknown) {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage restrictions.
  }
}

/**
 * Queues a temporary popup notification (and optional destination row highlight)
 * so feedback survives same-page actions, client transitions, and full reloads.
 */
export function queueAdminToast(payload: AdminToastPayload) {
  if (typeof window === 'undefined') return;
  const now = Date.now();
  const id = `${now}-${Math.random().toString(36).slice(2, 8)}`;
  const stored: StoredToast = { ...payload, id, createdAt: now };
  writeToastStorage(TOAST_STORAGE_KEY, stored);
  if (payload.highlightId || payload.highlightName) {
    const highlight: PendingHighlight = {
      id: payload.highlightId?.trim() || undefined,
      name: payload.highlightName?.trim() || undefined,
      expiresAt: now + HIGHLIGHT_TTL_MS,
    };
    writeToastStorage(HIGHLIGHT_STORAGE_KEY, highlight);
  }
  window.dispatchEvent(new CustomEvent<StoredToast>(TOAST_EVENT, { detail: stored }));
}
