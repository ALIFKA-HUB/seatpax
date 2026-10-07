import type { Sql } from 'postgres';
import { DomainError, withAdminTransaction, type Context, type DomainTx } from '@/modules/access/transaction';
import type { Cell, TemplateDetail } from './types';
export function createFleetRepository(client: Sql) {
  return {
    run<T>(ctx: Context, work: (tx: DomainTx) => Promise<T>) { return withAdminTransaction(client, ctx, work); },
    async template(tx: DomainTx, ctx: Context, id: string, lock = false): Promise<TemplateDetail> {
      const rows = await tx<Omit<TemplateDetail, 'capacity'>[]>`select t.id,t.name,t.rows,t.cols,t.status,t.version,coalesce((select json_agg(json_build_object('rowIndex',c.row_index,'colIndex',c.col_index,'type',c.type,'label',c.label,'seatCode',c.seat_code) order by c.row_index,c.col_index) from public.seat_template_cells c where c.seat_template_id=t.id and c.company_id=t.company_id),'[]'::json) as cells from public.seat_templates t where t.id=${id} and t.company_id=${ctx.companyId} ${lock ? tx`for update` : tx``}`;
      if (rows.length !== 1) throw new DomainError('forbidden', 'Template tidak tersedia.');
      const cells: Cell[] = rows[0].cells;
      return { ...rows[0], cells, capacity: cells.filter(cell => cell.type === 'SEAT').length };
    },
  };
}
export type FleetRepository = ReturnType<typeof createFleetRepository>;
