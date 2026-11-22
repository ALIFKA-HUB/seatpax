'use client';

import { useEffect, useRef, useState } from 'react';
import { DownloadSimple } from '@phosphor-icons/react/dist/csr/DownloadSimple';
import { MagnifyingGlassMinus } from '@phosphor-icons/react/dist/csr/MagnifyingGlassMinus';
import { MagnifyingGlassPlus } from '@phosphor-icons/react/dist/csr/MagnifyingGlassPlus';

export default function PdfPreview({
  url,
  downloadUrl,
  name,
}: {
  url: string;
  downloadUrl: string;
  name: string;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pagesRef = useRef<HTMLDivElement>(null);
  const [bytes, setBytes] = useState<Uint8Array | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    const controller = new AbortController();

    fetch(url, { credentials: 'same-origin', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = new Uint8Array(await response.arrayBuffer());
        if (!controller.signal.aborted) {
          setBytes(data);
        }
      })
      .catch(error => {
        if (error instanceof DOMException && error.name === 'AbortError') return;
        setStatus('error');
      });

    return () => controller.abort();
  }, [url]);

  useEffect(() => {
    if (!bytes) return;
    let cancelled = false;
    const renderTasks: Array<{ cancel: () => void }> = [];
    let loadingTask: { destroy: () => Promise<void> } | null = null;

    async function renderPdf() {
      try {
        const pdfjs = await import('pdfjs-dist');
        if (!pdfjs.GlobalWorkerOptions.workerSrc) {
          pdfjs.GlobalWorkerOptions.workerSrc = new URL(
            'pdfjs-dist/build/pdf.worker.min.mjs',
            import.meta.url,
          ).toString();
        }
        const task = pdfjs.getDocument({ data: bytes!.slice() });
        loadingTask = task;
        const doc = await task.promise;
        if (cancelled) {
          void task.destroy();
          return;
        }

        const container = pagesRef.current;
        const stage = stageRef.current;
        if (!container || !stage) return;
        container.replaceChildren();

        setNumPages(doc.numPages);
        const availableWidth = Math.max(260, stage.clientWidth - 32);
        const targetCssWidth = Math.min(availableWidth, 780);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
          if (cancelled) break;
          const page = await doc.getPage(pageNumber);
          if (cancelled) break;

          const baseViewport = page.getViewport({ scale: 1 });
          const fitScale = targetCssWidth / Math.max(1, baseViewport.width);
          const viewport = page.getViewport({ scale: fitScale * zoom });

          const card = document.createElement('div');
          card.className = 'hd-pdf-page';

          const canvas = document.createElement('canvas');
          canvas.width = Math.max(1, Math.floor(viewport.width * dpr));
          canvas.height = Math.max(1, Math.floor(viewport.height * dpr));
          canvas.style.width = `${Math.round(viewport.width)}px`;
          canvas.style.height = `${Math.round(viewport.height)}px`;
          canvas.setAttribute('aria-label', `${name} halaman ${pageNumber}`);
          card.appendChild(canvas);
          container.appendChild(card);

          const renderTask = page.render({
            canvas,
            viewport,
            transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
          });
          renderTasks.push(renderTask);
          await renderTask.promise;
        }

        if (!cancelled) setStatus('ready');
      } catch (error) {
        if (cancelled) return;
        if (error instanceof Error && error.name === 'RenderingCancelledException') return;
        setStatus('error');
      }
    }

    void renderPdf();

    return () => {
      cancelled = true;
      for (const task of renderTasks) task.cancel();
      if (loadingTask) void loadingTask.destroy();
    };
  }, [bytes, zoom, name]);

  return (
    <div ref={stageRef} className="hd-pdf-viewer">
      <div className="hd-pdf-bar">
        <span className="hd-pdf-page-info">
          {numPages > 0 ? `${numPages} halaman` : 'Dokumen PDF'}
        </span>
        <div className="hd-pdf-zoom">
          <button
            type="button"
            className="hd-pdf-zoom-btn"
            aria-label="Perkecil"
            disabled={zoom <= 0.75 || status !== 'ready'}
            onClick={() => setZoom(z => Math.max(0.75, Number((z - 0.25).toFixed(2))))}
          >
            <MagnifyingGlassMinus size={15} aria-hidden="true" />
          </button>
          <span className="hd-pdf-zoom-val">{Math.round(zoom * 100)}%</span>
          <button
            type="button"
            className="hd-pdf-zoom-btn"
            aria-label="Perbesar"
            disabled={zoom >= 2 || status !== 'ready'}
            onClick={() => setZoom(z => Math.min(2, Number((z + 0.25).toFixed(2))))}
          >
            <MagnifyingGlassPlus size={15} aria-hidden="true" />
          </button>
        </div>
      </div>

      {status === 'loading' && (
        <div className="hd-preview-state" role="status">
          Memuat pratinjau PDF…
        </div>
      )}

      {status === 'error' && (
        <div className="hd-preview-state is-error" role="alert">
          <p>Pratinjau PDF tidak dapat dimuat langsung di halaman ini.</p>
          <a className="hd-download-link" href={downloadUrl} download>
            <DownloadSimple size={16} aria-hidden="true" />
            <span>Unduh berkas</span>
          </a>
        </div>
      )}

      <div ref={pagesRef} className="hd-pdf-pages" hidden={status === 'error'} />
    </div>
  );
}
