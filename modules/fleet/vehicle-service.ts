import { DomainError, type Context, type DomainTx } from '@/modules/access/transaction';
import type { FleetRepository } from './repository';
import type { VehicleDetail } from './types';
import { parseVehicle } from './validation';
import { expectedCounter, resourceId } from './template-service';

async function vehicle(tx: DomainTx, ctx: Context, id: string, lock = false): Promise<VehicleDetail> {
  const rows = await tx<VehicleDetail[]>`select v.id,v.name,v.plate_number as "plateNumber",v.fleet_number as "fleetNumber",v.seat_template_id as "seatTemplateId",v.default_service_class_id as "defaultServiceClassId",v.status,v.revision,t.status as "templateStatus",c.status as "classStatus",(select count(*)::int from public.seat_template_cells sc where sc.seat_template_id=t.id and sc.company_id=v.company_id and sc.type='SEAT') as capacity from public.vehicles v join public.seat_templates t on t.id=v.seat_template_id and t.company_id=v.company_id join public.service_classes c on c.id=v.default_service_class_id and c.company_id=v.company_id where v.id=${id} and v.company_id=${ctx.companyId} ${lock ? tx`for update of v` : tx``}`;
  if (rows.length !== 1) throw new DomainError('forbidden', 'Armada tidak tersedia.');
  return rows[0];
}
export function createVehicleService(repo: FleetRepository) {
  return {
    list(ctx: Context) { return repo.run(ctx, async tx => {
      const ids = await tx<{ id: string }[]>`select id from public.vehicles where company_id=${ctx.companyId} order by name`;
      const results = [];
      for (const row of ids) results.push(await vehicle(tx, ctx, row.id));
      return results;
    }); },
    detail(ctx: Context, id: string) { resourceId(id); return repo.run(ctx, tx => vehicle(tx, ctx, id)); },
    save(ctx: Context, raw: unknown, id?: string, expectedRevision?: number) {
      if (id) resourceId(id);
      return repo.run(ctx, async tx => {
        let input;
        try { input = parseVehicle(raw); } catch { throw new DomainError('validation', 'Periksa nama, plat nomor, template dan kelas layanan.'); }
        const prior = id ? await vehicle(tx, ctx, id) : null;
        const templateIds = [...new Set([input.seatTemplateId, ...(prior ? [prior.seatTemplateId] : [])])].sort();
        const templates = await tx<{ id: string; status: string }[]>`select id,status from public.seat_templates where company_id=${ctx.companyId} and id in ${tx(templateIds)} order by id for share`;
        const classIds = [...new Set([input.defaultServiceClassId, ...(prior ? [prior.defaultServiceClassId] : [])])].sort();
        const classes = await tx<{ id: string; status: string }[]>`select id,status from public.service_classes where company_id=${ctx.companyId} and id in ${tx(classIds)} order by id for share`;
        if (templates.length !== templateIds.length || classes.length !== classIds.length) throw new DomainError('forbidden', 'Template atau kelas layanan tidak tersedia pada PO ini.');
        const current = id ? await vehicle(tx, ctx, id, true) : null;
        if (current) {
          expectedCounter(expectedRevision, current.revision);
          if (prior?.revision !== current.revision) throw new DomainError('conflict', 'Armada berubah. Muat data terbaru.');
        }
        if ((!current || current.seatTemplateId !== input.seatTemplateId) && templates.find(t => t.id === input.seatTemplateId)?.status !== 'ACTIVE') throw new DomainError('validation', 'Pilih template kursi aktif.');
        if ((!current || current.defaultServiceClassId !== input.defaultServiceClassId) && classes.find(c => c.id === input.defaultServiceClassId)?.status !== 'ACTIVE') throw new DomainError('validation', 'Pilih kelas layanan aktif.');
        const revision = current ? current.revision + 1 : 1;
        try {
          const saved = current
            ? await tx<{ id: string }[]>`update public.vehicles set name=${input.name},plate_number=${input.plateNumber},fleet_number=${input.fleetNumber},seat_template_id=${input.seatTemplateId},default_service_class_id=${input.defaultServiceClassId},status=${input.status},revision=${revision},updated_at=now() where id=${current.id} and company_id=${ctx.companyId} returning id`
            : await tx<{ id: string }[]>`insert into public.vehicles(company_id,name,plate_number,fleet_number,seat_template_id,default_service_class_id,status) values(${ctx.companyId},${input.name},${input.plateNumber},${input.fleetNumber},${input.seatTemplateId},${input.defaultServiceClassId},${input.status}) returning id`;
          return { vehicleId: saved[0].id, revision };
        } catch (error) {
          if (error instanceof Error && 'code' in error && error.code === '23505') throw new DomainError('validation', 'Plat nomor sudah digunakan pada PO ini.');
          throw error;
        }
      });
    },
  };
}
