import {getDatabase} from '@/lib/db';
import {createHelpdeskService} from '@/modules/helpdesk/service';
import {requestContext,rateLimit,boundedJson,result,failure} from '@/modules/helpdesk/http';
export async function POST(request:Request){try{const config=requestContext(request);await rateLimit(request,'track',30,60);const raw=await boundedJson(request);const code=typeof raw.code==='string'?raw.code.trim().toUpperCase():'';const item=await createHelpdeskService(getDatabase().$client,config).track(code);return item?result({item}):result({error:'Nomor pengaduan tidak ditemukan.'},404);}catch(error){return failure(error);}}
