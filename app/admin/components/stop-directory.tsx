'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  CheckCircle,
  MagnifyingGlass,
  MapPin,
  Plus,
  WarningCircle,
  X,
} from '@phosphor-icons/react/ssr';
import type { MasterRow } from '@/modules/route/repository';
import type { RegionOptions } from '@/modules/regions/types';
import MasterForm from './master-form';
import AdminSelect from './admin-select';
import AdminEmptyState from './admin-empty-state';
import AdminPaginationBar from './admin-pagination-bar';
import { DEFAULT_ADMIN_PAGE_SIZE, getPendingHighlightPage } from './admin-paginated-table';
import { queueAdminToast } from '../admin-toast';

export default function StopDirectory({
  companyId,
  stops,
  regionOptions,
}: {
  companyId: string;
  stops: MasterRow[];
  regionOptions: RegionOptions;
}) {
  const prefix = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const tableCardRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('ALL');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<MasterRow>();
  const [formKey, setFormKey] = useState(0);
  const [pending, setPending] = useState(false);
  const [feedback, setFeedback] = useState('');

  const needle = query.trim().toLocaleLowerCase('id-ID');
  const visible = useMemo(
    () =>
      stops.filter(
        stop =>
          (status === 'ALL' || stop.status === status) &&
          [stop.name, stop.city ?? ''].some(value =>
            value.toLocaleLowerCase('id-ID').includes(needle),
          ),
      ),
    [stops, status, needle],
  );
  const totalPages = Math.max(1, Math.ceil(visible.length / DEFAULT_ADMIN_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * DEFAULT_ADMIN_PAGE_SIZE;
  const endIndex = Math.min(startIndex + DEFAULT_ADMIN_PAGE_SIZE, visible.length);
  const pagedStops = visible.slice(startIndex, endIndex);
  const activeCount = stops.filter(s => s.status === 'ACTIVE').length;
  const unmappedCount = stops.filter(s => !s.regionRegencyId).length;

  useEffect(() => {
    if (!visible.length) return;
    const meta = visible.map(item => ({ id: item.id, name: item.name }));
    const targetPage = getPendingHighlightPage(meta, DEFAULT_ADMIN_PAGE_SIZE);
    if (targetPage !== null && targetPage !== page) {
      const frame = window.requestAnimationFrame(() => setPage(targetPage));
      return () => window.cancelAnimationFrame(frame);
    }
  }, [visible, page]);

  function openForm(stop?: MasterRow) {
    setEditing(stop);
    setFormKey(value => value + 1);
    setFeedback('');
    dialog.current?.showModal();
  }
  function closeForm() {
    if (!pending) dialog.current?.close();
  }
  function saved(savedName?: string) {
    const label = savedName || editing?.name || 'Titik';
    dialog.current?.close();
    setFeedback('');
    queueAdminToast({
      title: editing ? 'Perubahan titik tersimpan' : 'Titik baru ditambahkan',
      message: editing ? `${label} telah diperbarui.` : `${label} kini tampil di daftar titik.`,
      tone: 'ok',
      highlightId: editing?.id,
      highlightName: label,
    });
  }
  function deleted() {
    dialog.current?.close();
    setFeedback('');
    queueAdminToast({
      title: 'Titik dihapus permanen',
      message: `${editing?.name ?? 'Titik'} telah dihapus dari daftar titik.`,
      tone: 'ok',
    });
  }

  return (
    <div className="dash-root stop-directory">
      <header className="dash-hero stop-page-heading">
        <div className="dash-hero-copy">
          <h1>Titik naik &amp; turun</h1>
          <p>Atur lokasi yang dilayani PO Anda.</p>
        </div>
        <div className="dash-hero-actions">
          <button type="button" className="dash-primary-cta" onClick={() => openForm()}>
            <Plus size={16} weight="bold" aria-hidden="true" />
            <span>Tambah titik</span>
          </button>
        </div>
      </header>

      <div className="admin-stat-grid" role="region" aria-label="Ringkasan titik naik dan turun">
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-blue" aria-hidden="true">
            <MapPin size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{stops.length}</strong>
            <span className="admin-stat-label">Total titik PO</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-green" aria-hidden="true">
            <CheckCircle size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{activeCount}</strong>
            <span className="admin-stat-label">Titik aktif</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="dash-icon-badge is-amber" aria-hidden="true">
            <WarningCircle size={20} weight="duotone" />
          </span>
          <div className="admin-stat-meta">
            <strong className="admin-stat-value">{unmappedCount}</strong>
            <span className="admin-stat-label">Belum dipetakan wilayah</span>
          </div>
        </div>
      </div>

      <p className="stop-feedback" role="status">
        {feedback}
      </p>

      <section ref={tableCardRef} className="dash-card admin-table-card" aria-label="Daftar titik naik dan turun">
        <div className="admin-panel-head">
          <h2>
            Daftar titik <span className="admin-count">{stops.length}</span>
          </h2>
        </div>

        <div className="admin-table-toolbar">
          <label className="hd-search-box" htmlFor={prefix + 'search'}>
            <MagnifyingGlass size={18} aria-hidden="true" />
            <span className="stop-sr-only">Cari nama lokasi atau kota</span>
            <input
              id={prefix + 'search'}
              type="search"
              placeholder="Cari nama lokasi atau kota"
              value={query}
              onChange={event => {
                setQuery(event.target.value);
                setPage(1);
              }}
            />
          </label>
          <div className="admin-table-filter">
            <AdminSelect
              id={prefix + 'status'}
              ariaLabel="Filter status titik"
              value={status}
              onChange={next => {
                setStatus(next);
                setPage(1);
              }}
              options={[
                { value: 'ALL', label: 'Semua status' },
                { value: 'ACTIVE', label: 'Aktif' },
                { value: 'INACTIVE', label: 'Nonaktif' },
              ]}
            />
          </div>
        </div>

        {visible.length ? (
          <>
            <div className="admin-table-wrap" role="region" aria-label="Tabel lokasi" tabIndex={0}>
              <table className="admin-modern-table">
                <thead>
                  <tr>
                    <th>Lokasi</th>
                    <th>Kota / kabupaten</th>
                    <th>Status</th>
                    <th className="admin-col-action">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedStops.map(stop => (
                    <tr key={stop.id} data-row-id={stop.id} data-row-name={stop.name}>
                      <td>
                        <strong>{stop.name}</strong>
                        <small>{stop.address || 'Alamat belum ditambahkan'}</small>
                      </td>
                      <td>
                        {stop.city || '—'}
                        {!stop.regionRegencyId && <small>Wilayah belum dipetakan</small>}
                      </td>
                      <td>
                        <span
                          className={`admin-status-pill ${stop.status === 'ACTIVE' ? 'is-ok' : 'is-neutral'}`}
                        >
                          {stop.status === 'ACTIVE' ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="admin-col-action">
                        <button
                          type="button"
                          className="admin-row-action-btn"
                          aria-label={`Edit ${stop.name}`}
                          onClick={() => openForm(stop)}
                        >
                          Edit titik →
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <AdminPaginationBar
              mode="button"
              ariaLabel="Halaman titik"
              summary={`Menampilkan ${startIndex + 1}–${endIndex} dari ${visible.length} titik`}
              currentPage={safePage}
              totalPages={totalPages}
              onPageChange={next => {
                setPage(next);
                tableCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
              }}
            />
          </>
        ) : (
          <>
            <AdminEmptyState
              icon={<MapPin size={24} weight="duotone" />}
              title={stops.length ? 'Tidak ada titik yang cocok' : 'Mulai dari titik pertama'}
              description={
                stops.length
                  ? 'Coba nama lokasi, kota, atau status lainnya.'
                  : 'Tambahkan terminal, pool, atau lokasi naik dan turun yang dilayani PO Anda.'
              }
              action={
                stops.length ? (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      setStatus('ALL');
                      setPage(1);
                    }}
                  >
                    Reset pencarian
                  </button>
                ) : (
                  <button type="button" className="admin-primary" onClick={() => openForm()}>
                    Tambah titik
                  </button>
                )
              }
            />
            {stops.length > 0 && (
              <div className="admin-table-footer" role="status">
                <span>Menampilkan 0 dari {stops.length} titik</span>
              </div>
            )}
          </>
        )}
      </section>

      <dialog
        ref={dialog}
        className="stop-dialog"
        aria-labelledby={prefix + 'title'}
        onCancel={event => {
          if (pending) event.preventDefault();
        }}
      >
        <div className="stop-dialog-header">
          <div>
            <h2 id={prefix + 'title'}>{editing ? 'Edit titik' : 'Tambah titik'}</h2>
          </div>
          <button
            type="button"
            className="stop-close"
            aria-label="Tutup formulir"
            disabled={pending}
            onClick={closeForm}
          >
            <X size={22} aria-hidden="true" />
          </button>
        </div>
        <p className="stop-dialog-description">
          Isi detail lokasi agar mudah ditemukan saat menyusun rute perjalanan.
        </p>
        <MasterForm
          key={formKey}
          companyId={companyId}
          kind="stop"
          initial={editing}
          regionOptions={regionOptions}
          onSaved={saved}
          onDeleted={deleted}
          onPendingChange={setPending}
          onCancel={closeForm}
        />
      </dialog>
    </div>
  );
}
