import { beforeAll, afterAll, it, expect } from 'vitest';
import postgres, { type Sql } from 'postgres';
import { randomUUID } from 'node:crypto';
import { config } from 'dotenv';
import { parseMigrationEnvironment } from '@/lib/env/migration';
import { createFleetRepository } from '@/modules/fleet/repository';
import { createTemplateService } from '@/modules/fleet/template-service';
import { createVehicleService } from '@/modules/fleet/vehicle-service';
import { emptyGrid, setCell } from '@/modules/fleet/grid';
import { withAdminTransaction, type Context } from '@/modules/access/transaction';
config({ path: '.env.local', quiet: true });
let client: Sql;
beforeAll(async () => { client = postgres(parseMigrationEnvironment(process.env).url, { ssl: { rejectUnauthorized: true }, prepare: false, max: 5, connect_timeout: 5 }); await client`select 1`; });
afterAll(async () => { if (client) await client.end({ timeout: 5 }); });
async function fixture(run: (a: Context, b: Context, service: ReturnType<typeof createTemplateService>) => Promise<void>) {
  const a = { actorId: randomUUID(), companyId: randomUUID() }, b = { actorId: randomUUID(), companyId: randomUUID() };
  try {
    for (const c of [a, b]) await client.begin(async tx => {
      await tx`insert into auth.users(id) values(${c.actorId})`;
      await tx`insert into public.users(id) values(${c.actorId})`;
      await tx`insert into public.companies(id,name,slug) values(${c.companyId},'Fleet fixture',${'fleet-' + c.companyId})`;
      await tx`insert into public.memberships(user_id,company_id,role) values(${c.actorId},${c.companyId},'ADMIN_PO')`;
    });
    await run(a, b, createTemplateService(createFleetRepository(client)));
  } finally {
    await client.begin(async tx => {
      const ids = [a.companyId, b.companyId];
      await tx`delete from public.vehicles where company_id in ${tx(ids)}`;
      await tx`delete from public.seat_template_cells where company_id in ${tx(ids)}`;
      await tx`delete from public.seat_templates where company_id in ${tx(ids)}`;
      await tx`delete from public.service_classes where company_id in ${tx(ids)}`;
      await tx`delete from public.memberships where company_id in ${tx(ids)}`;
      await tx`delete from public.users where id in ${tx([a.actorId, b.actorId])}`;
      await tx`delete from auth.users where id in ${tx([a.actorId, b.actorId])}`;
      await tx`delete from public.companies where id in ${tx(ids)}`;
    });
  }
}
const input = () => ({ ...setCell(emptyGrid(2, 3), 0, 0, 'SEAT', 'Front', 'A1'), name: 'Layout' });
it('vehicle assignment stays tenant scoped, rejects duplicate plates and stale revisions', async () => fixture(async (a, b, templates) => {
  const service = createVehicleService(createFleetRepository(client));
  const template = await templates.save(a, input()), other = await templates.save(b, input());
  const classId = randomUUID(), foreignClass = randomUUID();
  await client`insert into public.service_classes(id,company_id,name,code) values(${classId},${a.companyId},'Class','class'),(${foreignClass},${b.companyId},'Class','class')`;
  const data = { name: 'Bus', plateNumber: ' b  123 ab ', fleetNumber: null, seatTemplateId: template.templateId, defaultServiceClassId: classId, status: 'ACTIVE' };
  const saved = await service.save(a, data);
  expect(await service.detail(a, saved.vehicleId)).toMatchObject({ plateNumber: 'B 123 AB', revision: 1, capacity: 1 });
  await expect(service.save(a, data)).rejects.toMatchObject({ code: 'validation' });
  await expect(service.save(a, { ...data, plateNumber: 'B 456 AB', seatTemplateId: other.templateId })).rejects.toMatchObject({ code: 'forbidden' });
  await expect(service.save(a, { ...data, plateNumber: 'B 456 AB', defaultServiceClassId: foreignClass })).rejects.toMatchObject({ code: 'forbidden' });
  await expect(service.detail(b, saved.vehicleId)).rejects.toMatchObject({ code: 'forbidden' });
  await expect(service.save(b, data, saved.vehicleId, 1)).rejects.toMatchObject({ code: 'forbidden' });
  expect(await service.list(b)).toHaveLength(0);
  const outcomes = await Promise.allSettled([service.save(a, { ...data, name: 'One' }, saved.vehicleId, 1), service.save(a, { ...data, name: 'Two' }, saved.vehicleId, 1)]);
  expect(outcomes.filter(o => o.status === 'fulfilled')).toHaveLength(1);
  expect(outcomes.find(o => o.status === 'rejected')).toMatchObject({ reason: { code: 'conflict' } });
  await templates.setStatus(a, template.templateId, 1, 'ARCHIVED');
  await client`update public.service_classes set status='INACTIVE' where id=${classId}`;
  await service.save(a, { ...data, status: 'MAINTENANCE' }, saved.vehicleId, 2);
  await expect(service.save(a, { ...data, plateNumber: 'B 789 AB' })).rejects.toMatchObject({ code: 'validation' });
  await templates.save(a, { ...input(), cells: setCell(input(), 0, 1, 'SEAT').cells }, template.templateId, 2);
  expect((await service.detail(a, saved.vehicleId)).capacity).toBe(2);
  const next = await templates.save(a, input());
  await client`update public.service_classes set status='ACTIVE' where id=${classId}`;
  expect((await service.save(a, { ...data, seatTemplateId: next.templateId }, saved.vehicleId, 3)).revision).toBe(4);
}));
it('reopens complete cells; invalid replacement rolls back; foreign tenants denied', async () => fixture(async (a, b, service) => {
  const saved = await service.save(a, input());
  expect(await service.detail(a, saved.templateId)).toMatchObject({ ...input(), version: 1, capacity: 1, status: 'ACTIVE' });
  await expect(service.save(a, { ...input(), cells: [] }, saved.templateId, 1)).rejects.toMatchObject({ code: 'validation' });
  expect((await service.detail(a, saved.templateId)).version).toBe(1);
  await expect(service.detail(b, saved.templateId)).rejects.toMatchObject({ code: 'forbidden' });
  await expect(service.save(b, input(), saved.templateId, 1)).rejects.toMatchObject({ code: 'forbidden' });
  const foreign = await service.save(b, input());
  await expect(service.detail(a, foreign.templateId)).rejects.toMatchObject({ code: 'forbidden' });
  expect(await service.list(a)).toHaveLength(1);
}));
it('serializes same-version writers and archive preserves cells', async () => fixture(async (a, _b, service) => {
  const saved = await service.save(a, input());
  const outcomes = await Promise.allSettled([service.save(a, { ...input(), name: 'One' }, saved.templateId, 1), service.save(a, { ...input(), name: 'Two' }, saved.templateId, 1)]);
  expect(outcomes.filter(o => o.status === 'fulfilled')).toHaveLength(1);
  expect(outcomes.find(o => o.status === 'rejected')).toMatchObject({ reason: { code: 'conflict' } });
  await service.setStatus(a, saved.templateId, 2, 'ARCHIVED');
  expect(await service.detail(a, saved.templateId)).toMatchObject({ version: 3, status: 'ARCHIVED', cells: input().cells });
  await service.setStatus(a, saved.templateId, 3, 'ACTIVE');
}));
it('database rejects malformed cells, foreign associations and invalid counters', async () => fixture(async (a, b, service) => {
  const saved = await service.save(a, input());
  await expect(client`insert into public.seat_template_cells(company_id,seat_template_id,row_index,col_index,type,seat_code) values(${a.companyId},${saved.templateId},0,0,'SEAT','B1')`).rejects.toMatchObject({ code: '23505' });
  await expect(client`update public.seat_template_cells set type='DRIVER' where seat_template_id=${saved.templateId} and type='SEAT'`).rejects.toMatchObject({ code: '23514' });
  await expect(client`update public.seat_template_cells set seat_code='a1' where seat_template_id=${saved.templateId} and type='SEAT'`).rejects.toMatchObject({ code: '23514' });
  await expect(client`update public.seat_templates set version=0 where id=${saved.templateId}`).rejects.toMatchObject({ code: '23514' });
  await expect(client`insert into public.seat_template_cells(company_id,seat_template_id,row_index,col_index,type) values(${b.companyId},${saved.templateId},2,0,'EMPTY')`).rejects.toMatchObject({ code: '23503' });
  for (const role of ['anon', 'authenticated']) for (const table of ['seat_templates', 'seat_template_cells', 'vehicles']) for (const privilege of ['SELECT', 'INSERT', 'UPDATE', 'DELETE']) {
    expect((await client`select has_table_privilege(${role},${'public.' + table},${privilege}) as allowed`)[0].allowed).toBe(false);
  }
}));
it('archive and revoke locks serialize assignment and reject subsequent writes', async () => fixture(async (a, _b, templates) => {
  const service = createVehicleService(createFleetRepository(client));
  const saved = await templates.save(a, input()), classId = randomUUID();
  await client`insert into public.service_classes(id,company_id,name,code) values(${classId},${a.companyId},'Class','class')`;
  let release!: () => void, ready!: () => void;
  const started = new Promise<void>(resolve => { ready = resolve; });
  const barrier = new Promise<void>(resolve => { release = resolve; });
  const archive = client.begin(async tx => {
    await tx`select id from public.seat_templates where id=${saved.templateId} for update`;
    ready(); await barrier;
    await tx`update public.seat_templates set status='ARCHIVED',version=2 where id=${saved.templateId}`;
  });
  const archivePromise = Promise.resolve(archive);
  await started;
  let settled = false;
  const data = { name: 'Bus', plateNumber: 'B 123', fleetNumber: null, seatTemplateId: saved.templateId, defaultServiceClassId: classId, status: 'ACTIVE' };
  const assign = service.save(a, data).finally(() => { settled = true; });
  const observed = expect(assign).rejects.toMatchObject({ code: 'validation' });
  try { await new Promise(resolve => setTimeout(resolve, 100)); expect(settled).toBe(false); } finally { release(); }
  await archivePromise; await observed;
  expect(await service.list(a)).toHaveLength(0);
  await templates.setStatus(a, saved.templateId, 2, 'ACTIVE');
  let finish!: () => void, entered!: () => void;
  const enteredPromise = new Promise<void>(resolve => { entered = resolve; });
  const finishPromise = new Promise<void>(resolve => { finish = resolve; });
  const guarded = withAdminTransaction(client, a, async () => { entered(); await finishPromise; });
  await enteredPromise;
  let revoked = false;
  const revoke = client`update public.memberships set status='DISABLED' where user_id=${a.actorId}`.then(() => { revoked = true; });
  try { await new Promise(resolve => setTimeout(resolve, 100)); expect(revoked).toBe(false); } finally { finish(); }
  await guarded; await revoke;
  await expect(service.save(a, data)).rejects.toMatchObject({ code: 'forbidden' });
}));
