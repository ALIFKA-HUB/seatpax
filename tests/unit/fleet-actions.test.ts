import { beforeEach, it, expect, vi } from 'vitest';
const f = vi.hoisted(() => ({ identity: vi.fn(), template: vi.fn(), status: vi.fn(), vehicle: vi.fn(), detailTemplate: vi.fn(), detailVehicle: vi.fn(), revalidate: vi.fn() }));
vi.mock('@/modules/auth/identity', () => ({ getVerifiedUser: f.identity }));
vi.mock('@/lib/db', () => ({ getDatabase: () => ({ $client: {} }) }));
vi.mock('@/modules/fleet/repository', () => ({ createFleetRepository: () => ({}) }));
vi.mock('@/modules/fleet/template-service', () => ({ createTemplateService: () => ({ save: f.template, setStatus: f.status, detail: f.detailTemplate }) }));
vi.mock('@/modules/fleet/vehicle-service', () => ({ createVehicleService: () => ({ save: f.vehicle, detail: f.detailVehicle }) }));
vi.mock('next/cache', () => ({ revalidatePath: f.revalidate }));
import { runFleetAction } from '@/app/admin/fleet-actions';
import { DomainError } from '@/modules/access/transaction';
const cid = '10000000-0000-4000-8000-000000000001', actorId = '10000000-0000-4000-8000-000000000002';
beforeEach(() => { vi.resetAllMocks(); f.identity.mockResolvedValue({ id: actorId }); f.template.mockResolvedValue({ templateId: cid, version: 2 }); f.vehicle.mockResolvedValue({ vehicleId: cid, revision: 2 }); });
it('denies missing identity and malformed commands without service calls', async () => {
  f.identity.mockResolvedValue(null);
  expect(await runFleetAction(cid, { kind: 'saveTemplate', input: {} })).toMatchObject({ ok: false, code: 'forbidden' });
  expect(await runFleetAction('bad', {})).toMatchObject({ ok: false, code: 'validation' });
  expect(await runFleetAction(cid, { kind: 'unknown' })).toMatchObject({ ok: false, code: 'validation' });
  expect(f.template).not.toHaveBeenCalled();
});
it('forwards only defined payload with verified context and fixed revalidation', async () => {
  const input = { name: 'Bus' };
  await runFleetAction(cid, { kind: 'saveTemplate', input, id: cid, version: 1, actorId: 'evil' });
  expect(f.template).toHaveBeenCalledWith({ actorId, companyId: cid }, input, cid, 1);
  await runFleetAction(cid, { kind: 'saveVehicle', input, id: cid, revision: 1 });
  expect(f.vehicle).toHaveBeenCalledWith({ actorId, companyId: cid }, input, cid, 1);
  await runFleetAction(cid, { kind: 'templateStatus', id: cid, version: 2, status: 'ARCHIVED' });
  expect(f.status).toHaveBeenCalledWith({ actorId, companyId: cid }, cid, 2, 'ARCHIVED');
  expect(f.revalidate).toHaveBeenCalledWith('/admin/companies/' + cid, 'layout');
});
it('returns complete latest states and preserves safe conflicts', async () => {
  f.detailTemplate.mockResolvedValue({ name: 'Latest', version: 3, cells: [{ type: 'DOOR' }] });
  expect(await runFleetAction(cid, { kind: 'refreshTemplate', id: cid })).toMatchObject({ ok: true, latestTemplate: { cells: [{ type: 'DOOR' }] } });
  f.detailVehicle.mockResolvedValue({ name: 'Bus', revision: 4 });
  expect(await runFleetAction(cid, { kind: 'refreshVehicle', id: cid })).toMatchObject({ ok: true, latestVehicle: { revision: 4 } });
  f.template.mockRejectedValue(new DomainError('conflict', 'Changed'));
  expect(await runFleetAction(cid, { kind: 'saveTemplate', input: {} })).toMatchObject({ ok: false, code: 'conflict' });
  f.template.mockRejectedValue(Error('SQL secret'));
  expect(JSON.stringify(await runFleetAction(cid, { kind: 'saveTemplate', input: {} }))).not.toContain('secret');
});
