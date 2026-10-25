'use server';
import {z} from 'zod';
import {getDatabase} from '@/lib/db';
import {requireAccess} from '@/modules/access/server';
import {withAdminTransaction,DomainError} from '@/modules/access/transaction';
import {helpdeskConfig} from '@/lib/env/helpdesk';
import {revalidatePath} from 'next/cache';
export async function manageHelpdeskStaff(form:FormData){try{const config=helpdeskConfig();const actor=await requireAccess('tenant.admin',config.companyId);const email=z.email().parse(String(form.get('email')).trim().toLowerCase());const status=z.enum(['ACTIVE','DISABLED']).parse(form.get('status'));await withAdminTransaction(getDatabase().$client,{actorId:actor.userId,companyId:config.companyId},async tx=>{const [user]=await tx`select u.id from public.users u join auth.users a on a.id=u.id where lower(u.email)=${email} and a.email_confirmed_at is not null`;if(!user)throw new DomainError('validation','Akun belum terdaftar. Minta petugas masuk dengan email terlebih dahulu.');await tx`insert into public.memberships(user_id,company_id,role,status) values(${user.id},${config.companyId},'HELPDESK',${status}) on conflict(user_id,company_id,role) where company_id is not null do update set status=excluded.status,updated_at=now()`;});revalidatePath('/admin/companies/'+config.companyId+'/helpdesk-staff');return {ok:true,message:'Akses petugas diperbarui.'};}catch(e){return {ok:false,message:e instanceof Error&&e.message.startsWith('Akun belum')?e.message:'Akses petugas belum dapat diperbarui.'};}}
