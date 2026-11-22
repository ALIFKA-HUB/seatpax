import { createHash } from 'node:crypto';

const IMAGE_MIMES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const PREVIEWABLE_MIMES = new Set(['application/pdf', ...IMAGE_MIMES]);

function matchesSignature(b: Buffer, mime: string) {
  return (
    (mime === 'application/pdf' && b.subarray(0, 5).toString() === '%PDF-') ||
    (mime === 'image/png' && b.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) ||
    (mime === 'image/jpeg' && b[0] === 255 && b[1] === 216 && b[2] === 255) ||
    (mime === 'image/webp' && b.subarray(0, 4).toString() === 'RIFF' && b.subarray(8, 12).toString() === 'WEBP')
  );
}

function normalizeName(name: string) {
  return name.split(/[\\/]/).pop()!.replace(/[\x00-\x1f]/g, '').slice(0, 160) || 'lampiran';
}

export function validateAttachmentBytes(bytes: Uint8Array, mime: string, name: string) {
  const b = Buffer.from(bytes);
  if (!b.length || b.length > 5242880) throw new Error('Setiap lampiran maksimal 5 MB.');
  if (!PREVIEWABLE_MIMES.has(mime) || !matchesSignature(b, mime)) {
    throw new Error('Gunakan lampiran JPG, PNG, WebP atau PDF yang valid.');
  }
  return {
    bytes: b,
    mime,
    name: normalizeName(name),
    size: b.length,
    hash: createHash('sha256').update(b).digest('hex'),
  };
}

export function isPreviewableMime(mime: string) {
  return PREVIEWABLE_MIMES.has(mime);
}

export function inspectPreviewAttachment(bytes: Uint8Array, mime: string, name: string) {
  const b = Buffer.from(bytes);
  if (!b.length || b.length > 5242880 || !PREVIEWABLE_MIMES.has(mime) || !matchesSignature(b, mime)) {
    throw new Error('Format lampiran tidak didukung untuk pratinjau web.');
  }
  const contentSecurityPolicy = IMAGE_MIMES.has(mime)
    ? "default-src 'none'; img-src 'self'; sandbox"
    : "frame-ancestors 'self'";
  return {
    bytes: b,
    mime,
    name: normalizeName(name),
    contentSecurityPolicy,
  };
}

export async function validateAttachments(files: File[]) {
  if (files.length > 3) throw new Error('Maksimal 3 lampiran.');
  return Promise.all(
    files.map(async f => validateAttachmentBytes(new Uint8Array(await f.arrayBuffer()), f.type, f.name)),
  );
}
