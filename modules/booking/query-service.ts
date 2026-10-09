import {z} from 'zod';
import {DomainError} from '@/modules/access/transaction';
import {inventoryRead} from '@/modules/inventory/transaction';
import type {BookingRepository} from './repository';
export function createBookingQueryService(repo:BookingRepository){const readMine=async(owner:string,id:string)=>inventoryRead(async()=>{if(!z.uuid().safeParse(owner).success||!z.uuid().safeParse(id).success)throw new DomainError('forbidden','Booking tidak tersedia.');const v=await repo.view(repo.client,owner,id);if(!v)throw new DomainError('forbidden','Booking tidak tersedia.');return v;});return {readMine,async listMine(owner:string){if(!z.uuid().safeParse(owner).success)throw new DomainError('forbidden','Masuk untuk melihat tiket.');const ids=await inventoryRead(()=>repo.list(owner));return Promise.all(ids.map(v=>readMine(owner,v.id)));}};}
