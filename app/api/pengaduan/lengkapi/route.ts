import {getDatabase} from '@/lib/db';
import {createHelpdeskService} from '@/modules/helpdesk/service';
import {validateAttachments} from '@/modules/helpdesk/attachments';
import {stageAttachments,discardStaged} from '@/lib/supabase/admin-storage';
import {requestContext,rateLimit,boundedForm,result,failure} from '@/modules/helpdesk/http';
export async function POST(request:Request){let staged:Awaited<ReturnType<typeof stageAttachments>>=[];try{const config=requestContext(request);await rateLimit(request,'supplement',10,3600);const form=await boundedForm(request);const input=Object.fromEntries([...form.entries()].filter(([key])=>key!=='files'));const files=form.getAll('files').filter((f):f is File=>f instanceof File&&f.size>0);staged=await stageAttachments(await validateAttachments(files));const saved=await createHelpdeskService(getDatabase().$client,config).supplement(input,staged);const unused=saved.replayed?staged:[];staged=[];await discardStaged(unused);return result({code:saved.code,status:saved.status});}catch(error){try{await discardStaged(staged);}catch{/* Recovery is documented. */}return failure(error);}}
