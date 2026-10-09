import {resourceId} from '@/modules/fleet/template-service';
import {DomainError} from '@/modules/access/transaction';
import {parseSnackInput} from '@/modules/snack/validation';
import type {BoardingActor} from '@/modules/boarding/types';
export function createSnackActions<Result>(deps:{getActor:()=>Promise<BoardingActor|null>;claim:(actor:BoardingActor,tripId:string,input:ReturnType<typeof parseSnackInput>)=>Promise<Result>}){return {async claim(tripId:string,raw:unknown){try{resourceId(tripId);const input=parseSnackInput(raw),actor=await deps.getActor();if(!actor||actor.role!=='CREW')throw new DomainError('forbidden','Akses ditolak.');return {ok:true as const,result:await deps.claim(actor,tripId,input)};}catch(error){return {ok:false as const,message:error instanceof DomainError&&error.code==='validation'?error.message:'Snack belum dapat dicatat. Periksa akses dan coba lagi.'};}}};}
