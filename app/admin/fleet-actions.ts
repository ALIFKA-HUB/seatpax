'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { getVerifiedUser } from '@/modules/auth/identity';
import { getDatabase } from '@/lib/db';
import { DomainError } from '@/modules/access/transaction';
import { createFleetRepository } from '@/modules/fleet/repository';
import { createTemplateService } from '@/modules/fleet/template-service';
import { createVehicleService } from '@/modules/fleet/vehicle-service';
import type { TemplateDetail, VehicleDetail } from '@/modules/fleet/types';
export type FleetActionResult = { ok: true; templateId?: string; version?: number; vehicleId?: string; revision?: number; latestTemplate?: TemplateDetail; latestVehicle?: VehicleDetail } | { ok: false; code: 'validation' | 'forbidden' | 'conflict' | 'unavailable'; message: string };
const uuid = z.uuid(), counter = z.number().int().positive();
const commands = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('saveTemplate'), id: uuid.optional(), version: counter.optional(), input: z.unknown() }),
  z.object({ kind: z.literal('templateStatus'), id: uuid, version: counter, status: z.enum(['ACTIVE', 'ARCHIVED']) }),
  z.object({ kind: z.literal('saveVehicle'), id: uuid.optional(), revision: counter.optional(), input: z.unknown() }),
  z.object({ kind: z.literal('refreshTemplate'), id: uuid }), z.object({ kind: z.literal('refreshVehicle'), id: uuid }),
]);
export async function runFleetAction(companyId: string, raw: unknown): Promise<FleetActionResult> {
  try {
    uuid.parse(companyId); const cmd = commands.parse(raw);
    const user = await getVerifiedUser();
    if (!user) return { ok: false, code: 'forbidden', message: 'Masuk kembali untuk melanjutkan.' };
    const ctx = { actorId: user.id, companyId }, repo = createFleetRepository(getDatabase().$client);
    const template = createTemplateService(repo), vehicle = createVehicleService(repo);
    if (cmd.kind === 'refreshTemplate') return { ok: true, latestTemplate: await template.detail(ctx, cmd.id) };
    if (cmd.kind === 'refreshVehicle') return { ok: true, latestVehicle: await vehicle.detail(ctx, cmd.id) };
    let result: FleetActionResult;
    if (cmd.kind === 'saveTemplate') result = { ok: true, ...await template.save(ctx, cmd.input, cmd.id, cmd.version) };
    else if (cmd.kind === 'templateStatus') result = { ok: true, ...await template.setStatus(ctx, cmd.id, cmd.version, cmd.status) };
    else result = { ok: true, ...await vehicle.save(ctx, cmd.input, cmd.id, cmd.revision) };
    revalidatePath('/admin/companies/' + companyId, 'layout');
    return result;
  } catch (error) {
    if (error instanceof z.ZodError) return { ok: false, code: 'validation', message: 'Periksa isian permintaan.' };
    if (error instanceof DomainError) return { ok: false, code: error.code, message: error.message };
    return { ok: false, code: 'unavailable', message: 'Permintaan belum berhasil. Coba lagi.' };
  }
}
