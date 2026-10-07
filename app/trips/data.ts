import 'server-only';
import {getDatabase} from '@/lib/db';
import {createInventoryRepository} from '@/modules/inventory/repository';
import {createAvailabilityService} from '@/modules/inventory/availability-service';
import {createHoldService} from '@/modules/inventory/hold-service';
export const passengerServices=()=>{const repo=createInventoryRepository(getDatabase().$client);return {availability:createAvailabilityService(repo),holds:createHoldService(repo)};};
