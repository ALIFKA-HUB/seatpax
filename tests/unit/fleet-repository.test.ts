import { expect, it, vi } from 'vitest';
import type { Sql } from 'postgres';
import type { DomainTx } from '@/modules/access/transaction';
import { createFleetRepository } from '@/modules/fleet/repository';
it('reads version, dimensions and all cells from one database snapshot', async () => {
  const row = { id: 'id', name: 'Layout', rows: 1, cols: 1, version: 1, status: 'ACTIVE', cells: [{ rowIndex: 0, colIndex: 0, type: 'SEAT', label: null, seatCode: '01' }] };
  const query = vi.fn((strings: TemplateStringsArray) => strings.join('').trim() ? Promise.resolve([row]) : {});
  const result = await createFleetRepository({} as Sql).template(query as unknown as DomainTx, { actorId: 'actor', companyId: 'company' }, 'id');
  expect(result.cells).toEqual(row.cells);
  expect(result.capacity).toBe(1);
  expect(query.mock.calls.filter(([strings]) => strings.join('').trim())).toHaveLength(1);
});

