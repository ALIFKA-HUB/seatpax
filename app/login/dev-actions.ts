'use server';
import {headers} from 'next/headers';
import {redirect} from 'next/navigation';
import {createClient} from '@supabase/supabase-js';
import {getDatabase} from '@/lib/db';
import {createServerSupabaseClient} from '@/lib/supabase/server';
import {quickLoginAccount,quickLoginAllowed} from '@/modules/auth/dev-login-policy';
import {validatedReturnPath} from '@/modules/auth/return-path';

export async function quickLoginAction(_previous:{message:string},form:FormData):Promise<{message:string}>{
 const request=await headers();
 if(!quickLoginAllowed(process.env,request.get('host')??'',request.get('origin')))return {message:'Login cepat hanya tersedia di development lokal.'};
 const account=quickLoginAccount(form.get('account'));
 if(!account)return {message:'Pilih akun testing yang tersedia.'};
 try {
  const [existing]=await getDatabase().$client<{id:string}[]>`select id from auth.users where email=${account.email} and email_confirmed_at is not null`;
  if(!existing)throw new Error('Unavailable test identity');
  const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
  if(!key)throw new Error('Missing server credential');
  const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,key,{auth:{persistSession:false,autoRefreshToken:false}});
  // Generate only: Supabase sends no email. Token hash stays on the server.
  const link=await admin.auth.admin.generateLink({type:'magiclink',email:account.email});
  if(link.error||!link.data.properties?.hashed_token)throw new Error('Unavailable test session');
  const client=await createServerSupabaseClient({cookieMode:'read-write'});
  const verified=await client.auth.verifyOtp({token_hash:link.data.properties.hashed_token,type:'email'});
  if(verified.error||verified.data.user?.id!==existing.id)throw new Error('Unavailable test session');
 }catch{return {message:'Akun testing belum dapat dibuka. Periksa koneksi dan konfigurasi server.'};}
 redirect(account.id==='customer'?(validatedReturnPath(form.get('next'))??account.href):account.href);
}
