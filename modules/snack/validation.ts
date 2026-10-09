import {z} from 'zod';
import {DomainError} from '@/modules/access/transaction';
const input=z.object({ticketId:z.uuid()});
export function parseSnackInput(raw:unknown){const result=input.safeParse(raw);if(!result.success)throw new DomainError('validation','Tiket tidak valid.');return result.data;}
