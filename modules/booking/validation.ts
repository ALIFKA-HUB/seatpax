import {z} from 'zod';
import {DomainError} from '@/modules/access/transaction';
import type {CheckoutInput} from './types';
export function normalizePhone(value:string){let s=value.trim().replace(/[\s()-]/g,'');if(s.startsWith('0'))s='+62'+s.slice(1);else if(s.startsWith('62'))s='+'+s;return s;}
const schema=z.object({holdId:z.uuid(),requestKey:z.uuid(),mode:z.enum(['SELF','OTHER']),name:z.string().trim().min(1).max(120),phone:z.string().transform(normalizePhone).pipe(z.string().regex(/^\+[1-9][0-9]{7,14}$/))});
export function parseCheckout(input:unknown):CheckoutInput{const v=schema.safeParse(input);if(!v.success)throw new DomainError('validation','Lengkapi nama dan nomor HP penumpang.');return v.data;}
