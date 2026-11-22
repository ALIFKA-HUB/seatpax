'use client';

import { type ReactNode, useEffect, useRef, useState } from 'react';
import {
  HIGHLIGHT_STORAGE_KEY,
  readToastStorage,
  type PendingHighlight,
} from '../admin-toast';
import AdminPaginationBar from './admin-pagination-bar';

export type AdminRowMeta = {
  id?: string;
  name?: string;
};

export const DEFAULT_ADMIN_PAGE_SIZE = 10;

/**
 * Resolves the 1-based page containing any active post-save row highlight target, if present.
 */
export function getPendingHighlightPage(
  meta: AdminRowMeta[],
  pageSize = DEFAULT_ADMIN_PAGE_SIZE,
): number | null {
  if (!meta.length) return null;
  const pending = readToastStorage<PendingHighlight>(HIGHLIGHT_STORAGE_KEY);
  if (!pending || Date.now() > pending.expiresAt) return null;
  let index = -1;
  if (pending.id) {
    index = meta.findIndex(item => item.id === pending.id);
  }
  if (index === -1 && pending.name) {
    const needle = pending.name.trim().toLocaleLowerCase('id-ID');
    index = meta.findIndex(item => (item.name ?? '').trim().toLocaleLowerCase('id-ID') === needle);
  }
  return index === -1 ? null : Math.floor(index / pageSize) + 1;
}

/**
 * Client-side paginated table shell for Admin PO list pages. Renders Page 1 during SSR
 * and jumps automatically to the destination page when a saved/updated row highlight is pending.
 */
export default function AdminPaginatedTable({
  ariaLabel,
  itemLabel,
  head,
  rows,
  rowMeta,
  pageSize = DEFAULT_ADMIN_PAGE_SIZE,
}: {
  ariaLabel: string;
  itemLabel: string;
  head: ReactNode;
  rows: ReactNode[];
  rowMeta?: AdminRowMeta[];
  pageSize?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(1);

  const total = rows.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, total);
  const visibleRows = rows.slice(startIndex, endIndex);

  useEffect(() => {
    if (!rowMeta?.length) return;
    const targetPage = getPendingHighlightPage(rowMeta, pageSize);
    if (targetPage !== null && targetPage !== page) {
      const frame = window.requestAnimationFrame(() => setPage(targetPage));
      return () => window.cancelAnimationFrame(frame);
    }
  }, [rowMeta, pageSize, page]);

  function handlePageChange(next: number) {
    const clamped = Math.max(1, Math.min(totalPages, next));
    setPage(clamped);
    wrapRef.current?.closest('.admin-table-card')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest',
    });
  }

  return (
    <>
      <div ref={wrapRef} className="admin-table-wrap" role="region" aria-label={ariaLabel} tabIndex={0}>
        <table className="admin-modern-table">
          <thead>{head}</thead>
          <tbody>{visibleRows}</tbody>
        </table>
      </div>
      <AdminPaginationBar
        mode="button"
        ariaLabel={`Halaman ${itemLabel}`}
        summary={`Menampilkan ${startIndex + 1}–${endIndex} dari ${total} ${itemLabel}`}
        currentPage={safePage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
      />
    </>
  );
}
