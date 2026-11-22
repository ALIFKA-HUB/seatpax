import { it, expect } from 'vitest';
import { inspectPreviewAttachment, validateAttachmentBytes } from '@/modules/helpdesk/attachments';

it('rejects disguised active files, oversized and unsupported files', () => {
  expect(() => validateAttachmentBytes(Buffer.from('<svg>'), 'image/png', 'x.png')).toThrow();
  expect(() => validateAttachmentBytes(Buffer.alloc(5242881), 'application/pdf', 'x.pdf')).toThrow();
  expect(validateAttachmentBytes(Buffer.from('%PDF-1.7 test'), 'application/pdf', '../test.pdf').name).toBe('test.pdf');
});

it('allows inline preview only for verified images and pdfs with restrictive csp', () => {
  const pdf = inspectPreviewAttachment(Buffer.from('%PDF-1.7 body'), 'application/pdf', '../evidence.pdf');
  expect(pdf.mime).toBe('application/pdf');
  expect(pdf.name).toBe('evidence.pdf');
  expect(pdf.contentSecurityPolicy).toContain("script-src 'none'");
  expect(pdf.contentSecurityPolicy).toContain("frame-ancestors 'self'");

  const png = inspectPreviewAttachment(
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]),
    'image/png',
    'photo.png',
  );
  expect(png.mime).toBe('image/png');
  expect(png.contentSecurityPolicy).toContain('sandbox');

  expect(() => inspectPreviewAttachment(Buffer.from('<svg></svg>'), 'image/svg+xml', 'x.svg')).toThrow();
  expect(() => inspectPreviewAttachment(Buffer.from('<html></html>'), 'text/html', 'x.html')).toThrow();
  expect(() => inspectPreviewAttachment(Buffer.from('<html></html>'), 'application/pdf', 'fake.pdf')).toThrow();
});
