import {resourceId} from '@/modules/fleet/template-service';
import {DomainError} from '@/modules/access/transaction';
import {parseBoardingInput,parseTicketToken} from '@/modules/boarding/validation';
import type {BoardingActor} from '@/modules/boarding/types';
export function createBoardingActions<Profile,Result>(deps:{getActor:()=>Promise<BoardingActor|null>;resolve:(actor:BoardingActor,tripId:string,token:string)=>Promise<Profile>;board:(actor:BoardingActor,tripId:string,input:ReturnType<typeof parseBoardingInput>)=>Promise<Result>}){
 async function actor(){const value=await deps.getActor();if(!value||value.role!=='CREW')throw new DomainError('forbidden','Masuk kembali sebagai crew yang ditugaskan.');return value;}
 return {
  async resolve(tripId:string,raw:unknown){try{resourceId(tripId);const token=parseTicketToken(raw);return {ok:true as const,profile:await deps.resolve(await actor(),tripId,token)};}catch{return {ok:false as const,message:'Tiket tidak tersedia pada perjalanan ini.'};}},
  async board(tripId:string,raw:unknown){try{resourceId(tripId);const input=parseBoardingInput(raw);return {ok:true as const,result:await deps.board(await actor(),tripId,input)};}catch(error){return {ok:false as const,message:error instanceof DomainError&&error.code==='validation'?error.message:'Boarding belum dapat dicatat. Periksa akses dan coba lagi.'};}},
 };
}
