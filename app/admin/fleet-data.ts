import 'server-only';
import { companyData } from './data';
import { getDatabase } from '@/lib/db';
import { createFleetRepository } from '@/modules/fleet/repository';
import { createTemplateService } from '@/modules/fleet/template-service';
import { createVehicleService } from '@/modules/fleet/vehicle-service';
export async function fleetData(companyId: string) {
  const existing = await companyData(companyId);
  const repo = createFleetRepository(getDatabase().$client);
  return { ...existing, templates: createTemplateService(repo), vehicles: createVehicleService(repo) };
}
