import {config} from 'dotenv';
import {createClient} from '@supabase/supabase-js';
import {parseMigrationEnvironment,DEV_PROJECT_REF} from '../lib/env/migration';
import {createDatabaseConnection} from '../lib/db/connection';
config({path:'.env.local',quiet:true});
const target=parseMigrationEnvironment(process.env),url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
if(!url||new URL(url).hostname!==DEV_PROJECT_REF+'.supabase.co'||!key)throw new Error('Development storage configuration missing.');
const connection=createDatabaseConnection(target.url),store=createClient(url,key,{auth:{persistSession:false}}).storage.from('seatpax-helpdesk');
try{const {data,error}=await store.list('staged',{limit:1000,sortBy:{column:'created_at',order:'asc'}});if(error)throw new Error();let removed=0;for(const item of data||[]){if(!item.id||!item.created_at||Date.now()-new Date(item.created_at).getTime()<86400000)continue;const path='staged/'+item.name;const [ref]=await connection.db.$client`select id from public.helpdesk_attachments where path=${path}`;if(ref)continue;const {error}=await store.remove([path]);if(error)throw new Error();removed++;}console.log('Unreferenced old staged files removed:',removed);}catch{console.error('Storage cleanup incomplete. No referenced evidence is removed.');process.exitCode=1;}finally{await connection.close();}
