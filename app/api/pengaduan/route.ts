import {after} from 'next/server';
import {getDatabase} from '@/lib/db';
import {createHelpdeskService} from '@/modules/helpdesk/service';
import {submissionSchema} from '@/modules/helpdesk/validation';
import {validateAttachments} from '@/modules/helpdesk/attachments';
import {stageAttachments,discardStaged} from '@/lib/supabase/admin-storage';
import {requestContext,rateLimit,boundedForm,result,failure} from '@/modules/helpdesk/http';
import {drainHelpdeskMail} from '@/modules/helpdesk/mail-worker';
export const runtime='nodejs';
export async function POST(request:Request){let staged:Awaited<ReturnType<typeof stageAttachments>>=[];try{const config=requestContext(request);await rateLimit(request,'submit',5,3600);const form=await boundedForm(request);const input=submissionSchema.parse(Object.fromEntries([...form.entries()].filter(([key])=>key!=='files')));await rateLimit(request,'email',5,3600,input.email);const files=form.getAll('files').filter((f):f is File=>f instanceof File&&f.size>0);staged=await stageAttachments(await validateAttachments(files));const submitted=await createHelpdeskService(getDatabase().$client,config).submit(input,staged);const unused=submitted.replayed?staged:[];staged=[];await discardStaged(unused);after(async()=>{try{await drainHelpdeskMail(getDatabase().$client,config,{limit:2});}catch{/* Durable jobs remain for recovery. */}});return result({code:submitted.code,status:submitted.status});}catch(error){try{await discardStaged(staged);}catch{/* Orphan cleanup handles unavailable storage. */}return failure(error);}}
