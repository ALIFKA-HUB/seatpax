import 'server-only';
import {getVerifiedUser} from '@/modules/auth/identity';
import {getDatabase} from '@/lib/db';
import {parsePaymentEnv} from '@/lib/env/payment';
import {createHoldService} from '@/modules/inventory/hold-service';
import {createInventoryRepository} from '@/modules/inventory/repository';
export async function checkoutData(holdId:string){
 const user=await getVerifiedUser();if(!user) return null;
 try{const client=getDatabase().$client,view=await createHoldService(createInventoryRepository(client)).readMine(user.id,holdId);const profiles=await client<{name:string|null;phone:string|null}[]>`select name,phone from public.users where id=${user.id} limit 1`;let clientKey:string|null=null;try{clientKey=parsePaymentEnv(process.env).clientKey;}catch{}
  return {userId:user.id,email:user.email??'',profile:{name:profiles[0]?.name??'',phone:profiles[0]?.phone??''},hold:view,clientKey};
 }catch{return null;}
}
