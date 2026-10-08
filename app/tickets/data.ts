import 'server-only';
import {getVerifiedUser} from '@/modules/auth/identity';
import {getDatabase} from '@/lib/db';
import {createTicketRepository} from '@/modules/ticket/repository';
import {createTicketService,type TicketView} from '@/modules/ticket/service';
import type {TicketKeys} from '@/modules/ticket/crypto';
function service(){const text=process.env.TICKET_ENCRYPTION_KEY;if(!text||!/^[A-Za-z0-9+/]{43}=$/.test(text))return null;const key=Buffer.from(text,'base64');if(key.length!==32)return null;const keys:TicketKeys={v1:key};return createTicketService({...createTicketRepository(),client:getDatabase().$client},keys);}
export async function ticketsData():Promise<{tickets:TicketView[]|null}>{const user=await getVerifiedUser();if(!user)return {tickets:null};try{const svc=service();return {tickets:svc?await svc.listMine(user.id):null};}catch{return {tickets:null};}}
export async function ticketData(ticketId:string):Promise<TicketView|null>{const user=await getVerifiedUser();if(!user)return null;try{const svc=service();return svc?await svc.readMine(user.id,ticketId):null;}catch{return null;}}
