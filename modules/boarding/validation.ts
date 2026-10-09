import {z} from 'zod';
import {DomainError} from '@/modules/access/transaction';
const input=z.object({ticketId:z.uuid(),stopId:z.uuid(),source:z.enum(['QR','MANIFEST'])});
export function parseBoardingInput(raw:unknown){const result=input.safeParse(raw);if(!result.success)throw new DomainError('validation','Tiket, stop atau sumber boarding tidak valid.');return result.data;}
export function parseTicketToken(raw:unknown):string{if(typeof raw!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(raw))throw new DomainError('validation','QR tiket tidak valid.');return raw;}
export function assertManifestCompany(actual:string,requested:string){if(actual!==requested)throw new DomainError('forbidden','Manifest tidak tersedia pada PO ini.');}
