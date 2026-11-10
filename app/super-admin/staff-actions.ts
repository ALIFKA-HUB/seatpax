'use server';

import {revalidatePath} from 'next/cache';
import {createClient} from '@supabase/supabase-js';
import {getDatabase} from '@/lib/db';
import {getVerifiedUser} from '@/modules/auth/identity';
import {DomainError} from '@/modules/access/transaction';
import {createStaffDirectoryRepository} from '@/modules/staff-directory/repository';
import {createStaffDirectoryService} from '@/modules/staff-directory/service';
import {resolveDirectoryCompany} from '@/modules/staff-directory/validation';

export async function ensureSupabaseAuthUser(email:string,name:string):Promise<string>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key){
  throw new DomainError('unavailable','Layanan akun belum tersedia.');
 }
 try{
  const admin=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {data,error}=await admin.auth.admin.createUser({
   email,
   email_confirm:true,
   user_metadata:{name},
  });
  if(error||!data.user?.id){
   throw new DomainError('unavailable','Layanan akun belum tersedia.');
  }
  return data.user.id;
 }catch(err){
  if(err instanceof DomainError)throw err;
  throw new DomainError('unavailable','Layanan akun belum tersedia.');
 }
}

export async function createStaffFormAction(formData:FormData):Promise<void>{
 const user=await getVerifiedUser();
 if(!user)throw new DomainError('forbidden','Akses Super Admin ditolak.');
 const companyId=resolveDirectoryCompany(process.env);
 const name=formData.get('name');
 const email=formData.get('email');
 const role=formData.get('role');
 const repo=createStaffDirectoryRepository(getDatabase().$client);
 const service=createStaffDirectoryService(repo,ensureSupabaseAuthUser);
 await service.createStaff(user.id,companyId,{name,email,role});
 revalidatePath('/super-admin');
}

export async function updateStaffFormAction(formData:FormData):Promise<void>{
 const user=await getVerifiedUser();
 if(!user)throw new DomainError('forbidden','Akses Super Admin ditolak.');
 const companyId=resolveDirectoryCompany(process.env);
 const userId=formData.get('userId');
 const role=formData.get('role');
 const status=formData.get('status');
 const repo=createStaffDirectoryRepository(getDatabase().$client);
 const service=createStaffDirectoryService(repo);
 await service.updateStaff(user.id,companyId,{userId,role,status});
 revalidatePath('/super-admin');
}
