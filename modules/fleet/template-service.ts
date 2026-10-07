import { z } from 'zod';
import { DomainError, type Context } from '@/modules/access/transaction';
import type { FleetRepository } from './repository';
import type { TemplateStatus } from './types';
import { parseTemplate } from './validation';

export function resourceId(id: string) {
  if (!z.uuid().safeParse(id).success) throw new DomainError('validation', 'ID tidak valid.');
}
export function expectedCounter(counter: number | undefined, actual: number) {
  if (!Number.isInteger(counter) || counter !== actual) throw new DomainError('conflict', 'Data berubah. Muat data terbaru sebelum menyimpan.');
}
export function createTemplateService(repo: FleetRepository) {
  return {
    list(ctx: Context) { return repo.run(ctx, async tx => {
      const ids = await tx<{ id: string }[]>`select id from public.seat_templates where company_id=${ctx.companyId} order by name`;
      const results = [];
      for (const row of ids) results.push(await repo.template(tx, ctx, row.id));
      return results;
    }); },
    detail(ctx: Context, id: string) { resourceId(id); return repo.run(ctx, tx => repo.template(tx, ctx, id)); },
    save(ctx: Context, raw: unknown, id?: string, expectedVersion?: number) {
      if (id) resourceId(id);
      return repo.run(ctx, async tx => {
        const old = id ? await repo.template(tx, ctx, id, true) : null;
        if (old) expectedCounter(expectedVersion, old.version);
        let input;
        try { input = parseTemplate(raw); } catch { throw new DomainError('validation', 'Periksa nama, ukuran grid, dan kode kursi unik.'); }
        const version = old ? old.version + 1 : 1;
        const saved = old
          ? await tx<{ id: string }[]>`update public.seat_templates set name=${input.name},rows=${input.rows},cols=${input.cols},version=${version},updated_at=now() where id=${old.id} and company_id=${ctx.companyId} returning id`
          : await tx<{ id: string }[]>`insert into public.seat_templates(company_id,name,rows,cols) values(${ctx.companyId},${input.name},${input.rows},${input.cols}) returning id`;
        const templateId = saved[0].id;
        await tx`delete from public.seat_template_cells where seat_template_id=${templateId} and company_id=${ctx.companyId}`;
        await tx`insert into public.seat_template_cells ${tx(input.cells.map(cell => ({ company_id: ctx.companyId, seat_template_id: templateId, row_index: cell.rowIndex, col_index: cell.colIndex, type: cell.type, label: cell.label, seat_code: cell.seatCode })))}`;
        return { templateId, version };
      });
    },
    setStatus(ctx: Context, id: string, expectedVersion: number, status: TemplateStatus) {
      resourceId(id);
      return repo.run(ctx, async tx => {
        const current = await repo.template(tx, ctx, id, true);
        expectedCounter(expectedVersion, current.version);
        if (status !== 'ACTIVE' && status !== 'ARCHIVED') throw new DomainError('validation', 'Status tidak valid.');
        const version = current.version + 1;
        await tx`update public.seat_templates set status=${status},version=${version},updated_at=now() where id=${id} and company_id=${ctx.companyId}`;
        return { templateId: id, version };
      });
    },
  };
}

