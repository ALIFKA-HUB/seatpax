import {z} from 'zod';
import {DomainError} from '@/modules/access/transaction';
const decision=z.object({companyId:z.uuid(),target:z.enum(['ACTIVE','SUSPENDED']),expectedStatusRevision:z.number().int().min(0).max(2147483647)});
export function parseCompanyStatusInput(raw:unknown){const parsed=decision.safeParse(raw);if(!parsed.success)throw new DomainError('validation','Keputusan status PO tidak valid.');return parsed.data;}
