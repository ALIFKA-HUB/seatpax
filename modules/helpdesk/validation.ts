import {z} from 'zod';
import type {ComplaintStatus,Priority,PublicCase} from './types';
export const submissionSchema=z.object({requestKey:z.uuid(),name:z.string().trim().min(2).max(120),email:z.email().max(254).transform(v=>v.toLowerCase()),category:z.enum(['PAYMENT','JOURNEY','BUG','OTHER']),title:z.string().trim().min(5).max(160),description:z.string().trim().min(10).max(5000),bookingReference:z.string().trim().max(120).optional()}).strict();
export const supplementSchema=z.object({code:z.string().max(100),grant:z.string().max(200),requestKey:z.uuid(),description:z.string().trim().min(10).max(5000)}).strict();
export type SubmissionInput=z.infer<typeof submissionSchema>;
export function transition(from:ComplaintStatus,to:ComplaintStatus,priority:Priority|null,note:string):ComplaintStatus {
 const allowed:Record<ComplaintStatus,ComplaintStatus[]>={MENUNGGU:['DIPROSES','PERLU_DILENGKAPI'],DIPROSES:['PERLU_DILENGKAPI','SELESAI'],PERLU_DILENGKAPI:['MENUNGGU'],SELESAI:[]};
 if(!allowed[from]?.includes(to))throw new Error('Perubahan status tidak diizinkan.');
 if(to==='DIPROSES'&&!priority)throw new Error('Tentukan prioritas terlebih dahulu.');
 if(['PERLU_DILENGKAPI','SELESAI'].includes(to)&&note.trim().length<10)throw new Error('Tulis keterangan minimal 10 karakter.');
 return to;
}
export function publicCase(row:Record<string,unknown>):PublicCase {return {code:String(row.code),title:String(row.title),category:row.category as PublicCase['category'],status:row.status as ComplaintStatus,priority:row.priority as Priority|null,createdAt:String(row.created_at),updatedAt:String(row.updated_at),publicRequest:row.public_request as string|null,publicOutcome:row.public_outcome as string|null};}
