import {getDatabase} from '@/lib/db';
import {requireAccess} from '@/modules/access/server';
import {helpdeskConfig} from '@/lib/env/helpdesk';
import {staffTransaction} from '@/modules/helpdesk/repository';
import {privateStorage} from '@/lib/supabase/admin-storage';
import {z} from 'zod';
export async function GET(_request:Request,{params}:{params:Promise<{id:string}>}){try{const {id}=await params;z.uuid().parse(id);const config=helpdeskConfig();const actor=await requireAccess('helpdesk.read',config.companyId);const file=await staffTransaction(getDatabase().$client,{actorId:actor.userId,companyId:config.companyId},false,async tx=>{const [r]=await tx`select a.* from public.helpdesk_attachments a join public.helpdesk_cases c on c.id=a.case_id where a.id=${id} and c.company_id=${config.companyId}`;return r;});if(!file)return new Response('Tidak ditemukan',{status:404});const {data,error}=await privateStorage().download(String(file.path));if(error||!data)throw new Error();return new Response(data,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(String(file.name)),'X-Content-Type-Options':'nosniff','Cache-Control':'no-store'}});}catch{return new Response('Akses lampiran tidak tersedia.',{status:403});}}
