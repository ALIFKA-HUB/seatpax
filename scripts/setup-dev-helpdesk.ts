import {config} from 'dotenv';
import {createClient} from '@supabase/supabase-js';
import postgres from 'postgres';
import {parseMigrationEnvironment,DEV_PROJECT_REF} from '../lib/env/migration';
config({path:'.env.local',quiet:true});
const env=parseMigrationEnvironment(process.env);
if(process.env.NEXT_PUBLIC_SUPABASE_URL!==`https://${DEV_PROJECT_REF}.supabase.co`||!process.env.SUPABASE_SERVICE_ROLE_KEY)throw new Error('Development project configuration required');
const admin=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.SUPABASE_SERVICE_ROLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const db=postgres(env.url,{max:1,prepare:false,ssl:{rejectUnauthorized:true},connect_timeout:5});
const email='johancocthird+helpdesk@gmail.com',company='00000000-0000-4000-8000-000000000001';
let created:string|undefined;
try {
 const [po]=await db`select id from public.companies where id=${company} and slug='demo-po-a' and status='ACTIVE'`;
 if(!po)throw new Error('Active Demo PO A required');
 let [user]=await db<{id:string;confirmed:boolean}[]>`select id,email_confirmed_at is not null as confirmed from auth.users where email=${email}`;
 if(!user){const result=await admin.auth.admin.createUser({email,email_confirm:true});if(result.error||!result.data.user)throw new Error('Could not create testing identity');user={id:result.data.user.id,confirmed:true};created=user.id;}
 if(!user.confirmed)throw new Error('Existing testing identity is unconfirmed; no membership changes applied');
 await db.begin(async tx=>{
  const memberships=await tx`select company_id,role,status from public.memberships where user_id=${user.id} for update`;
  if(memberships.some(m=>m.company_id!==company||m.role!=='HELPDESK'||m.status!=='ACTIVE'))throw new Error('Existing membership differs; no changes applied');
  await tx`insert into public.users(id,email) values(${user.id},${email}) on conflict(id) do nothing`;
  if(!memberships.length)await tx`insert into public.memberships(user_id,company_id,role,status) values(${user.id},${company},'HELPDESK','ACTIVE')`;
 });
 console.log('Ready: HELPDESK | '+email+' | Demo PO A');created=undefined;
}catch(e){if(created)await admin.auth.admin.deleteUser(created);console.error('Development Helpdesk setup failed:',e instanceof Error?e.message:'Unknown error');process.exitCode=1;}finally{await db.end({timeout:1})}
