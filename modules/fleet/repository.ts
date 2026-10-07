import type { Sql } from 'postgres';
import { DomainError, withAdminTransaction, type Context, type DomainTx } from '@/modules/access/transaction';
import type { Cell, TemplateDetail } from './types';
export function createFleetRepository(client: Sql) {
  return {
    run<T>(ctx: Context, work: (tx: DomainTx) => Promise<T>) { return withAdminTransaction(client, ctx, work); },
    async template(tx: DomainTx, ctx: Context, id: string, lock = false): Promise<TemplateDetail> {
      const rows = await tx<Omit<TemplateDetail, 'cells' | 'capacity'>[]>`select id,name,rows,cols,status,version from public.seat_templates where id=${id} and company_id=${ctx.companyId} ${lock ? tx`for update` : tx``}`;
      if (rows.length !== 1) throw new DomainError('forbidden', 'Template tidak tersedia.');
      const cells = await tx<Cell[]>`select row_index as "rowIndex",col_index as "colIndex",type,label,seat_code as "seatCode" from public.seat_template_cells where seat_template_id=${id} and company_id=${ctx.companyId} order by row_index,col_index`;
      return { ...rows[0], cells, capacity: cells.filter(cell => cell.type === 'SEAT').length };
    },
  };
}
export type FleetRepository = ReturnType<typeof createFleetRepository>;
