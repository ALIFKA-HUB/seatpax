import {it,expect} from 'vitest';
import {effectiveStatus} from '@/modules/inventory/hold-service';
import type {HoldRecord} from '@/modules/inventory/types';
import {createHoldService} from '@/modules/inventory/hold-service';
import type {InventoryRepository} from '@/modules/inventory/repository';
it('honors exclusive expiry at PostgreSQL microsecond precision',()=>{const h={status:'ACTIVE',effectiveExpiresAt:'2026-10-09 01:00:00.123456+00'} as HoldRecord;expect(effectiveStatus(h,'2026-10-09 01:00:00.123455+00')).toBe('ACTIVE');expect(effectiveStatus(h,'2026-10-09 01:00:00.123456+00')).toBe('EXPIRED');});
it('maps idempotency lookup connection failure to safe unavailable',async()=>{const repo={client:{},byKey:async()=>{throw Object.assign(Error('private connection detail'),{code:'CONNECT_TIMEOUT'});}} as unknown as InventoryRepository;const id='10000000-0000-4000-8000-000000000001';await expect(createHoldService(repo).create(id,{tripId:id,seatId:id,fromStopId:id,toStopId:id,requestKey:id})).rejects.toMatchObject({code:'unavailable'});});
