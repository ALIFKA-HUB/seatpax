import {NextResponse} from 'next/server';
import {parseMigrationEnvironment} from '@/lib/env/migration';
import {parsePaymentEnv} from '@/lib/env/payment';
import {createDatabaseConnection} from '@/lib/db/connection';
import {createMidtransProvider} from '@/modules/payment/midtrans-provider';
import {createPaymentRepository} from '@/modules/payment/repository';
import {createPaymentEventService} from '@/modules/payment/event-service';
import {createPaymentNotificationService} from '@/modules/payment/notification-service';
import {createConfirmationService} from '@/modules/payment/confirmation-service';
import {UnknownPaymentOrderError} from '@/modules/payment/event-service';
import {DomainError} from '@/modules/access/transaction';
export const runtime='nodejs';
async function bodyAtMost64KiB(request:Request){
 const declared=Number(request.headers.get('content-length')??0);if(declared>65536)throw new DomainError('validation','Notifikasi terlalu besar.');
 if(!request.body)return '';const reader=request.body.getReader(),chunks:Uint8Array[]=[];let size=0;
 try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>65536){await reader.cancel();throw new DomainError('validation','Notifikasi terlalu besar.');}chunks.push(value);}}finally{reader.releaseLock();}
 return new TextDecoder().decode(Buffer.concat(chunks));
}
export async function POST(request:Request){
 let connection:ReturnType<typeof createDatabaseConnection>|undefined;
 try{
  const raw=await bodyAtMost64KiB(request),migration=parseMigrationEnvironment(process.env),env=parsePaymentEnv(process.env);connection=createDatabaseConnection(migration.url);
  const repo=createPaymentRepository(connection.db.$client),provider=createMidtransProvider(env),events=createPaymentEventService(repo,provider,createConfirmationService(repo,env));
  const result=await createPaymentNotificationService(provider,events).receive(raw);
  // The receipt is durable before processing. Failure here is harmless: the event lease/reconciler recovers it.
  await events.process(result.receiptId).catch(()=> 'RETRY');
  return NextResponse.json(result,{status:200});
 }catch(error){
  if(error instanceof UnknownPaymentOrderError)return NextResponse.json({error:'unknown_order'},{status:404});
  if(error instanceof DomainError&&error.code==='validation')return NextResponse.json({error:'invalid_notification'},{status:400});
  if(error instanceof DomainError&&error.code==='forbidden')return NextResponse.json({error:'invalid_signature'},{status:401});
  return NextResponse.json({error:'temporarily_unavailable'},{status:503});
 }finally{await connection?.close().catch(()=>{});}
}
