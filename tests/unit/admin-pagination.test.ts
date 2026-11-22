import { afterEach, describe, expect, it, vi } from 'vitest';
import { createElement as h } from 'react';
import { renderToStaticMarkup as render } from 'react-dom/server';
import AdminPaginationBar, { getPaginationItems } from '@/app/admin/components/admin-pagination-bar';
import AdminPaginatedTable, {
  getPendingHighlightPage,
} from '@/app/admin/components/admin-paginated-table';
import { HIGHLIGHT_STORAGE_KEY } from '@/app/admin/admin-toast';

describe('Admin PO table pagination', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('generates full range up to 7 pages and compact ellipses for larger page counts', () => {
    expect(getPaginationItems(1, 1)).toEqual([1]);
    expect(getPaginationItems(2, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(getPaginationItems(1, 12)).toEqual([1, 2, 'ellipsis', 12]);
    expect(getPaginationItems(6, 12)).toEqual([1, 'ellipsis', 5, 6, 7, 'ellipsis', 12]);
    expect(getPaginationItems(12, 12)).toEqual([1, 'ellipsis', 11, 12]);
  });

  it('slices rows to pageSize in SSR while keeping table landmarks and summary counts', () => {
    const rows = Array.from({ length: 14 }, (_, index) =>
      h('tr', { key: `row-${index}` }, h('td', null, `Item ${index + 1}`)),
    );
    const html = render(
      h(AdminPaginatedTable, {
        ariaLabel: 'Daftar armada',
        itemLabel: 'armada',
        head: h('tr', null, h('th', null, 'Armada')),
        rows,
        pageSize: 10,
      }),
    );

    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Daftar armada"');
    expect(html).toContain('Item 1');
    expect(html).toContain('Item 10');
    expect(html).not.toContain('Item 11');
    expect(html).toContain('Menampilkan 1–10 dari 14 armada');
    expect(html).toContain('aria-current="page">1<');
    expect(html).toContain('>2<');
  });

  it('computes auto-jump page for pending highlighted records across pages', () => {
    const meta = Array.from({ length: 23 }, (_, i) => ({
      id: `id-${i + 1}`,
      name: `Armada ${i + 1}`,
    }));
    const store = new Map<string, string>();
    store.set(
      HIGHLIGHT_STORAGE_KEY,
      JSON.stringify({ id: 'id-22', name: 'Armada 22', expiresAt: Date.now() + 60_000 }),
    );
    vi.stubGlobal('window', {
      sessionStorage: {
        getItem: (key: string) => store.get(key) ?? null,
      },
    });

    expect(getPendingHighlightPage(meta, 10)).toBe(3);

    store.set(
      HIGHLIGHT_STORAGE_KEY,
      JSON.stringify({ name: 'armada 12', expiresAt: Date.now() + 60_000 }),
    );
    expect(getPendingHighlightPage(meta, 10)).toBe(2);

    store.set(
      HIGHLIGHT_STORAGE_KEY,
      JSON.stringify({ id: 'id-22', expiresAt: Date.now() - 10 }),
    );
    expect(getPendingHighlightPage(meta, 10)).toBeNull();
  });

  it('renders link pagination mode cleanly without active next links when hasNext is false', () => {
    const html = render(
      h(AdminPaginationBar, {
        mode: 'link',
        ariaLabel: 'Halaman laporan',
        summary: 'Menampilkan 3 laporan · 3 belum selesai',
        currentPage: 1,
        hasNext: false,
        pageHref: page => `/admin/companies/a/helpdesk?page=${page}`,
      }),
    );

    expect(html).toContain('Menampilkan 3 laporan · 3 belum selesai');
    expect(html).toContain('aria-disabled="true"');
    expect(html).not.toContain('page=2');
  });
});
