'use server';
import {z} from 'zod';
import {revalidatePath} from 'next/cache';
import {getVerifiedUser} from '@/modules/auth/identity';
import {getDatabase} from '@/lib/db';
import {createRouteRepository} from '@/modules/route/repository';
import {createRouteService} from '@/modules/route/service';
import {createPricingService} from '@/modules/pricing/service';
import {DomainError} from '@/modules/access/transaction';
export type ActionResult={ok:true;revision?:number;routeId?:string;stopIds?:string[];quote?:{currency:'IDR';total:string}}|{ok:false;code:'validation'|'forbidden'|'conflict'|'unavailable';message:string};
const uuid=z.uuid();
const commandSchema=z.discriminatedUnion('kind',[
  z.object({kind:z.literal('stop'),id:uuid.optional(),input:z.unknown()}),
  z.object({kind:z.literal('class'),id:uuid.optional(),input:z.unknown()}),
  z.object({kind:z.literal('route'),id:uuid.optional(),revision:z.number().int().positive().optional(),input:z.unknown()}),
  z.object({kind:z.literal('status'),id:uuid,revision:z.number().int().positive(),status:z.enum(['ACTIVE','INACTIVE'])}),
  z.object({kind:z.literal('fare'),routeId:uuid,serviceClassId:uuid,revision:z.number().int().positive(),prices:z.array(z.string()).max(49),remove:z.boolean().optional()}),
  z.object({kind:z.literal('quote'),routeId:uuid,serviceClassId:uuid,fromRouteStopId:uuid,toRouteStopId:uuid}),
  z.object({kind:z.literal('refresh'),routeId:uuid}),
]);
export async function runAdminAction(companyId:string,raw:unknown):Promise<ActionResult>{
  try{
    uuid.parse(companyId);const cmd=commandSchema.parse(raw);
    const user=await getVerifiedUser();if(!user)return {ok:false,code:'forbidden',message:'Masuk kembali untuk melanjutkan.'};
    const context={actorId:user.id,companyId};const repo=createRouteRepository(getDatabase().$client);const route=createRouteService(repo);const pricing=createPricingService(repo);
    let result:ActionResult={ok:true};
    if(cmd.kind==='stop')await route.saveStop(context,cmd.input,cmd.id);
    if(cmd.kind==='class')await route.saveClass(context,cmd.input,cmd.id);
    if(cmd.kind==='route')result={ok:true,...await route.saveRoute(context,cmd.input,cmd.id,cmd.revision)};
    if(cmd.kind==='status')result={ok:true,...await route.setRouteStatus(context,cmd.id,cmd.revision,cmd.status)};
    if(cmd.kind==='fare')result={ok:true,...await pricing.save(context,{routeId:cmd.routeId,serviceClassId:cmd.serviceClassId,expectedRevision:cmd.revision,prices:cmd.prices},cmd.remove)};
    if(cmd.kind==='quote')return {ok:true,quote:await pricing.preview(context,cmd)};
    if(cmd.kind==='refresh'){const current=await route.detail(context,cmd.routeId);return {ok:true,revision:current.route.revision,stopIds:current.stops.map(s=>s.stopId)};}
    revalidatePath('/admin/companies/'+companyId,'layout');return result;
  }catch(error){
    if(error instanceof z.ZodError)return {ok:false,code:'validation',message:'Periksa isian: nama, kode, urutan stop dan waktu harus valid.'};
    if(error instanceof DomainError)return {ok:false,code:error.code,message:error.message};
    return {ok:false,code:'unavailable',message:'Permintaan belum berhasil. Coba lagi.'};
  }
}
