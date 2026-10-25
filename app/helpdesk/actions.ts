'use server';
import {revalidatePath} from 'next/cache';
import {after} from 'next/server';
import {getDatabase} from '@/lib/db';
import {helpdeskContext} from './data';
import {drainHelpdeskMail} from '@/modules/helpdesk/mail-worker';
export async function changeComplaintAction(form:FormData){try{const {ctx,staff,config}=await helpdeskContext(true);const result=await staff.mutate(ctx,Object.fromEntries(form));revalidatePath('/helpdesk');revalidatePath('/helpdesk/'+result.id);after(async()=>{try{await drainHelpdeskMail(getDatabase().$client,config,{limit:3});}catch{/* Recovery worker owns pending jobs. */}});return {ok:true,message:'Perubahan disimpan.'};}catch(e){return {ok:false,message:e instanceof Error&&/prioritas|keterangan|Laporan|status|Perubahan/.test(e.message)?e.message:'Perubahan belum dapat disimpan. Periksa akses dan muat ulang halaman.'};}}
export async function retryComplaintEmailAction(form:FormData){try{const {ctx,staff,config}=await helpdeskContext(true);await staff.retryMail(ctx,String(form.get('jobId')));await drainHelpdeskMail(getDatabase().$client,config,{limit:3});revalidatePath('/helpdesk');return {ok:true,message:'Percobaan pengiriman dijadwalkan.'};}catch{return {ok:false,message:'Email belum dapat dikirim ulang.'};}}
