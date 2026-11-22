import Link from 'next/link';
import { CaretLeft, CaretRight } from '@phosphor-icons/react/ssr';

export type PaginationToken = number | 'ellipsis';

/**
 * Computes compact page tokens (always preserving first, last, and adjacent pages).
 */
export function getPaginationItems(currentPage: number, totalPages: number): PaginationToken[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }
  const tokens: PaginationToken[] = [1];
  const left = Math.max(2, currentPage - 1);
  const right = Math.min(totalPages - 1, currentPage + 1);
  if (left > 2) tokens.push('ellipsis');
  for (let p = left; p <= right; p += 1) tokens.push(p);
  if (right < totalPages - 1) tokens.push('ellipsis');
  tokens.push(totalPages);
  return tokens;
}

type LinkMode = {
  mode: 'link';
  pageHref: (page: number) => string;
  hasNext: boolean;
  totalPages?: number;
};

type ButtonMode = {
  mode: 'button';
  totalPages: number;
  onPageChange: (page: number) => void;
};

/**
 * Shared footer summary + pagination controls rendered across every Admin PO table card.
 */
export default function AdminPaginationBar({
  summary,
  currentPage,
  ariaLabel,
  ...controls
}: {
  summary: string;
  currentPage: number;
  ariaLabel: string;
} & (LinkMode | ButtonMode)) {
  const prevDisabled = currentPage <= 1;
  const nextDisabled =
    controls.mode === 'link' ? !controls.hasNext : currentPage >= controls.totalPages;
  const tokens =
    controls.mode === 'button'
      ? getPaginationItems(currentPage, controls.totalPages)
      : controls.totalPages
        ? getPaginationItems(currentPage, controls.totalPages)
        : [currentPage];

  return (
    <div className="admin-table-footer" role="status">
      <span className="admin-table-summary">{summary}</span>
      <nav className="admin-pagination" aria-label={ariaLabel}>
        {controls.mode === 'link' ? (
          prevDisabled ? (
            <span className="admin-page-btn is-disabled" aria-disabled="true">
              <CaretLeft size={14} weight="bold" aria-hidden="true" />
              <span>Sebelumnya</span>
            </span>
          ) : (
            <Link className="admin-page-btn" href={controls.pageHref(currentPage - 1)}>
              <CaretLeft size={14} weight="bold" aria-hidden="true" />
              <span>Sebelumnya</span>
            </Link>
          )
        ) : (
          <button
            type="button"
            className="admin-page-btn"
            disabled={prevDisabled}
            onClick={() => controls.onPageChange(currentPage - 1)}
          >
            <CaretLeft size={14} weight="bold" aria-hidden="true" />
            <span>Sebelumnya</span>
          </button>
        )}

        <div className="admin-page-numbers">
          {tokens.map((token, index) => {
            if (token === 'ellipsis') {
              return (
                <span key={`e-${index}`} className="admin-page-ellipsis" aria-hidden="true">
                  …
                </span>
              );
            }
            const active = token === currentPage;
            if (controls.mode === 'link') {
              return active ? (
                <span key={token} className="admin-page-num is-active" aria-current="page">
                  {token}
                </span>
              ) : (
                <Link key={token} className="admin-page-num" href={controls.pageHref(token)}>
                  {token}
                </Link>
              );
            }
            return (
              <button
                key={token}
                type="button"
                className={`admin-page-num${active ? ' is-active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={() => controls.onPageChange(token)}
              >
                {token}
              </button>
            );
          })}
        </div>

        {controls.mode === 'link' ? (
          nextDisabled ? (
            <span className="admin-page-btn is-disabled" aria-disabled="true">
              <span>Berikutnya</span>
              <CaretRight size={14} weight="bold" aria-hidden="true" />
            </span>
          ) : (
            <Link className="admin-page-btn" href={controls.pageHref(currentPage + 1)}>
              <span>Berikutnya</span>
              <CaretRight size={14} weight="bold" aria-hidden="true" />
            </Link>
          )
        ) : (
          <button
            type="button"
            className="admin-page-btn"
            disabled={nextDisabled}
            onClick={() => controls.onPageChange(currentPage + 1)}
          >
            <span>Berikutnya</span>
            <CaretRight size={14} weight="bold" aria-hidden="true" />
          </button>
        )}
      </nav>
    </div>
  );
}
