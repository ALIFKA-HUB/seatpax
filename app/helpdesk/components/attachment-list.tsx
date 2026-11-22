'use client';

import { useRef, useState } from 'react';
import { ArrowSquareOut } from '@phosphor-icons/react/dist/csr/ArrowSquareOut';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { Eye } from '@phosphor-icons/react/dist/csr/Eye';
import { File } from '@phosphor-icons/react/dist/csr/File';
import { FilePdf } from '@phosphor-icons/react/dist/csr/FilePdf';
import { Image as ImageIcon } from '@phosphor-icons/react/dist/csr/Image';
import { X } from '@phosphor-icons/react/dist/csr/X';
import PdfPreview from './pdf-preview';

export type HelpdeskAttachmentItem = {
  id: string;
  name: string;
  mime: string;
  size: number;
};

function canPreview(mime: string) {
  return (
    mime === 'application/pdf' ||
    mime === 'image/png' ||
    mime === 'image/jpeg' ||
    mime === 'image/webp'
  );
}

function formatKindLabel(mime: string) {
  if (mime === 'application/pdf') return 'PDF';
  if (mime === 'image/png') return 'PNG';
  if (mime === 'image/jpeg') return 'JPG';
  if (mime === 'image/webp') return 'WebP';
  return 'Berkas';
}

export default function AttachmentList({ files }: { files: HelpdeskAttachmentItem[] }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [active, setActive] = useState<HelpdeskAttachmentItem | null>(null);
  const [imgError, setImgError] = useState(false);

  if (!files.length) {
    return <p className="hd-muted-label">Tidak ada lampiran.</p>;
  }

  function openPreview(file: HelpdeskAttachmentItem) {
    setImgError(false);
    setActive(file);
    dialogRef.current?.showModal();
  }

  function closePreview() {
    dialogRef.current?.close();
    setActive(null);
    setImgError(false);
  }

  const activeUrl = active ? `/api/helpdesk/attachments/${active.id}?preview=1` : '';
  const activeDownloadUrl = active ? `/api/helpdesk/attachments/${active.id}` : '';
  const isPdf = active?.mime === 'application/pdf';

  return (
    <>
      <ul className="hd-attachment-list">
        {files.map(file => {
          const previewable = canPreview(file.mime);
          const kb = Math.max(1, Math.ceil(Number(file.size) / 1024));
          const isFilePdf = file.mime === 'application/pdf';
          const isFileImage = file.mime.startsWith('image/');
          const downloadHref = `/api/helpdesk/attachments/${file.id}`;

          return (
            <li key={file.id} className="hd-attachment-item">
              <div className="hd-attachment-info">
                <span className="hd-attachment-icon" aria-hidden="true">
                  {isFilePdf ? (
                    <FilePdf size={20} weight="duotone" />
                  ) : isFileImage ? (
                    <ImageIcon size={20} weight="duotone" />
                  ) : (
                    <File size={20} weight="duotone" />
                  )}
                </span>
                <div className="hd-attachment-text">
                  <strong className="hd-attachment-name">{file.name}</strong>
                  <span className="hd-attachment-meta">
                    {formatKindLabel(file.mime)} ({kb} KB)
                  </span>
                </div>
              </div>
              <div className="hd-attachment-actions">
                {previewable && (
                  <button
                    type="button"
                    className="hd-preview-btn"
                    onClick={() => openPreview(file)}
                  >
                    <Eye size={16} aria-hidden="true" />
                    <span>Pratinjau</span>
                  </button>
                )}
                <a className="hd-download-link" href={downloadHref} download>
                  <DownloadSimple size={16} aria-hidden="true" />
                  <span>Unduh</span>
                </a>
              </div>
            </li>
          );
        })}
      </ul>

      <dialog
        ref={dialogRef}
        className="hd-preview-dialog"
        aria-label={active ? `Pratinjau lampiran ${active.name}` : 'Pratinjau lampiran'}
        onClose={() => setActive(null)}
        onClick={event => {
          if (event.target === dialogRef.current) closePreview();
        }}
      >
        {active && (
          <div className="hd-preview-shell">
            <header className="hd-preview-head">
              <div className="hd-preview-title">
                <strong>{active.name}</strong>
                <span>
                  {formatKindLabel(active.mime)} ({Math.max(1, Math.ceil(Number(active.size) / 1024))} KB)
                </span>
              </div>
              <div className="hd-preview-tools">
                <a
                  className="hd-download-link"
                  href={activeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ArrowSquareOut size={16} aria-hidden="true" />
                  <span>Buka tab baru</span>
                </a>
                <a className="hd-download-link" href={activeDownloadUrl} download>
                  <DownloadSimple size={16} aria-hidden="true" />
                  <span>Unduh</span>
                </a>
                <button
                  type="button"
                  className="hd-preview-close"
                  aria-label="Tutup pratinjau"
                  onClick={closePreview}
                >
                  <X size={18} aria-hidden="true" />
                </button>
              </div>
            </header>
            <div className="hd-preview-body">
              {isPdf ? (
                <PdfPreview
                  key={active.id}
                  url={activeUrl}
                  downloadUrl={activeDownloadUrl}
                  name={active.name}
                />
              ) : imgError ? (
                <div className="hd-preview-state is-error" role="alert">
                  <p>Gambar tidak dapat ditampilkan langsung.</p>
                  <a className="hd-download-link" href={activeDownloadUrl} download>
                    <DownloadSimple size={16} aria-hidden="true" />
                    <span>Unduh berkas</span>
                  </a>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  className="hd-preview-image"
                  src={activeUrl}
                  alt={active.name}
                  onError={() => setImgError(true)}
                />
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
