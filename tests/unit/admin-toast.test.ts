import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearToastStorage,
  HIGHLIGHT_STORAGE_KEY,
  queueAdminToast,
  readToastStorage,
  TOAST_EVENT,
  TOAST_STORAGE_KEY,
  type PendingHighlight,
  type StoredToast,
} from '@/app/admin/admin-toast';
import { renderToStaticMarkup as render } from 'react-dom/server';
import { createElement as h } from 'react';
import AdminToastViewport from '@/app/admin/components/admin-toast';

vi.mock('next/navigation', () => ({ usePathname: () => '/admin/companies/a/vehicles' }));

describe('admin-toast store and viewport', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('no-ops cleanly in SSR when window is undefined and renders empty viewport initially', () => {
    expect(() =>
      queueAdminToast({
        title: 'Armada baru ditambahkan',
        highlightId: 'v-1',
        highlightName: 'HiAce',
      }),
    ).not.toThrow();
    expect(readToastStorage(TOAST_STORAGE_KEY)).toBeNull();
    expect(() => clearToastStorage(TOAST_STORAGE_KEY)).not.toThrow();
    expect(render(h(AdminToastViewport))).toBe('');
  });

  it('queues toast payload, highlight metadata, and dispatches browser event', () => {
    const store = new Map<string, string>();
    const dispatchEvent = vi.fn();

    class FakeCustomEvent<T> {
      type: string;
      detail: T;
      constructor(type: string, init?: { detail: T }) {
        this.type = type;
        this.detail = init!.detail;
      }
    }

    vi.stubGlobal('CustomEvent', FakeCustomEvent);
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => {
          store.set(key, value);
        },
        removeItem: (key: string) => {
          store.delete(key);
        },
      },
      dispatchEvent,
    });

    queueAdminToast({
      title: 'Armada baru ditambahkan',
      message: 'HiAce Commuter kini tampil di daftar armada.',
      tone: 'ok',
      highlightId: 'v-123',
      highlightName: '  HiAce Commuter  ',
    });

    const storedToast = readToastStorage<StoredToast>(TOAST_STORAGE_KEY);
    expect(storedToast).toMatchObject({
      title: 'Armada baru ditambahkan',
      message: 'HiAce Commuter kini tampil di daftar armada.',
      tone: 'ok',
    });
    expect(typeof storedToast?.createdAt).toBe('number');

    const storedHighlight = readToastStorage<PendingHighlight>(HIGHLIGHT_STORAGE_KEY);
    expect(storedHighlight).toMatchObject({
      id: 'v-123',
      name: 'HiAce Commuter',
    });
    expect(storedHighlight!.expiresAt).toBeGreaterThan(Date.now() - 100);

    expect(dispatchEvent).toHaveBeenCalledTimes(1);
    const dispatched = dispatchEvent.mock.calls[0][0] as { type: string; detail: StoredToast };
    expect(dispatched.type).toBe(TOAST_EVENT);
    expect(dispatched.detail.id).toBe(storedToast?.id);

    clearToastStorage(TOAST_STORAGE_KEY);
    expect(readToastStorage(TOAST_STORAGE_KEY)).toBeNull();
  });

  it('handles storage exceptions gracefully', () => {
    const dispatchEvent = vi.fn();
    vi.stubGlobal('CustomEvent', class {
      constructor(public type: string, public init?: { detail: unknown }) {}
    });
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: () => {
          throw new Error('blocked');
        },
        setItem: () => {
          throw new Error('quota');
        },
        removeItem: () => {
          throw new Error('blocked');
        },
      },
      dispatchEvent,
    });

    expect(() => queueAdminToast({ title: 'Test', highlightName: 'Row' })).not.toThrow();
    expect(readToastStorage(TOAST_STORAGE_KEY)).toBeNull();
    expect(() => clearToastStorage(TOAST_STORAGE_KEY)).not.toThrow();
    expect(dispatchEvent).toHaveBeenCalledTimes(1);
  });
});
