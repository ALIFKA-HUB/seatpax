import {getDatabase} from '@/lib/db';
import {createHelpdeskService} from '@/modules/helpdesk/service';
import {requestContext,rateLimit,boundedJson,result,failure} from '@/modules/helpdesk/http';
export async function POST(request:Request){try{const config=requestContext(request);await rateLimit(request,'grant-check',30,60);const raw=await boundedJson(request);const item=await createHelpdeskService(getDatabase().$client,config).supplementRequest(String(raw.code||''),String(raw.grant||''));return item?result({item}):result({error:'Tautan tidak valid, sudah digunakan, atau telah diganti.'},400);}catch(error){return failure(error);}}
