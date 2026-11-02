import {z} from 'zod';
import {DomainError} from '@/modules/access/transaction';
import type {StaffDirectoryQuery} from './types';
export const directoryQuerySchema=z.object({q:z.string().max(80),status:z.enum(['all','active','disabled']),page:z.number().int().positive().max(Number.MAX_SAFE_INTEGER)});
export function parseDirectoryQuery(raw:{q?:unknown;status?:unknown;page?:unknown}):StaffDirectoryQuery{
 const q=typeof raw.q==='string'?raw.q.trim().slice(0,80):'';
 const status=raw.status==='active'||raw.status==='disabled'?raw.status:'all';
 const value=typeof raw.page==='string'&&/^\d+$/.test(raw.page)?Number(raw.page):typeof raw.page==='number'?raw.page:1;
 return {q,status,page:Number.isSafeInteger(value)&&value>0?value:1};
}
export function resolveDirectoryCompany(env:{NODE_ENV?:string;SEATPAX_COMPANY_ID?:string}):string{
 const value=env.SEATPAX_COMPANY_ID===undefined&&env.NODE_ENV==='development'?'00000000-0000-4000-8000-000000000001':env.SEATPAX_COMPANY_ID?.trim();
 if(!z.uuid().safeParse(value).success)throw new DomainError('unavailable','Data perusahaan belum tersedia.');
 return value!;
}
