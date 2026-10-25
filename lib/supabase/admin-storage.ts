import 'server-only';
import {createClient} from '@supabase/supabase-js';
import {randomUUID} from 'node:crypto';
import type {validateAttachmentBytes} from '@/modules/helpdesk/attachments';
const bucket='seatpax-helpdesk';
export function privateStorage(){const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;if(!url||!key)throw new Error('Penyimpanan lampiran belum dikonfigurasi.');return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}}).storage.from(bucket);}
export async function stageAttachments(files:ReturnType<typeof validateAttachmentBytes>[]){if(!files.length)return [];const storage=privateStorage();const staged:import('@/modules/helpdesk/service').StoredAttachment[]=[];try{for(const f of files){const path='staged/'+randomUUID();const {error}=await storage.upload(path,f.bytes,{contentType:f.mime,upsert:false});if(error)throw new Error('Lampiran belum dapat disimpan.');staged.push({path,name:f.name,mime:f.mime,size:f.size,hash:f.hash});}return staged;}catch(e){if(staged.length)await storage.remove(staged.map(f=>f.path));throw e;}}
export async function discardStaged(files:{path:string}[]){if(files.length)await privateStorage().remove(files.map(f=>f.path));}
