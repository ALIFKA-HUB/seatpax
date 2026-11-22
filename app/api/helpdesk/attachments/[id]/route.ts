import { z } from 'zod';
import { getDatabase } from '@/lib/db';
import { helpdeskConfig } from '@/lib/env/helpdesk';
import { privateStorage } from '@/lib/supabase/admin-storage';
import { requireAccess } from '@/modules/access/server';
import { inspectPreviewAttachment } from '@/modules/helpdesk/attachments';
import { staffTransaction } from '@/modules/helpdesk/repository';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    z.uuid().parse(id);
    const config = helpdeskConfig();
    const actor = await requireAccess('helpdesk.read', config.companyId);
    const file = await staffTransaction(
      getDatabase().$client,
      { actorId: actor.userId, companyId: config.companyId },
      false,
      async tx => {
        const [r] = await tx`
          select a.*
          from public.helpdesk_attachments a
          join public.helpdesk_cases c on c.id = a.case_id
          where a.id = ${id} and c.company_id = ${config.companyId}
        `;
        return r;
      },
    );
    if (!file) return new Response('Tidak ditemukan', { status: 404 });

    const { data, error } = await privateStorage().download(String(file.path));
    if (error || !data) throw new Error();

    const preview = new URL(request.url).searchParams.get('preview') === '1';
    if (!preview) {
      return new Response(data, {
        headers: {
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': "attachment; filename*=UTF-8''" + encodeURIComponent(String(file.name)),
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'no-store',
        },
      });
    }

    const bytes = new Uint8Array(await data.arrayBuffer());
    let verified: ReturnType<typeof inspectPreviewAttachment>;
    try {
      verified = inspectPreviewAttachment(bytes, String(file.mime), String(file.name));
    } catch {
      return new Response('Format lampiran tidak didukung untuk pratinjau web.', { status: 415 });
    }

    return new Response(new Uint8Array(verified.bytes), {
      headers: {
        'Content-Type': verified.mime,
        'Content-Disposition': "inline; filename*=UTF-8''" + encodeURIComponent(verified.name),
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'no-referrer',
        'Cache-Control': 'no-store',
        'Content-Security-Policy': verified.contentSecurityPolicy,
      },
    });
  } catch {
    return new Response('Akses lampiran tidak tersedia.', { status: 403 });
  }
}
