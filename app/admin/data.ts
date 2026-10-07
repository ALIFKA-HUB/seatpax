import 'server-only';
import {redirect,notFound} from 'next/navigation';
import {z} from 'zod';
import {getVerifiedUser} from '@/modules/auth/identity';
import {getDatabase} from '@/lib/db';
import {createRouteRepository} from '@/modules/route/repository';
import {createRouteService} from '@/modules/route/service';
import {createPricingService} from '@/modules/pricing/service';
import {listAdminCompanies} from '@/modules/access/transaction';
export async function adminCompanies(){const user=await getVerifiedUser();if(!user)redirect('/login');return listAdminCompanies(getDatabase().$client,user.id);}
export async function companyData(companyId:string){if(!z.uuid().safeParse(companyId).success)notFound();const user=await getVerifiedUser();if(!user)redirect('/login');const context={actorId:user.id,companyId};const repo=createRouteRepository(getDatabase().$client);const route=createRouteService(repo);
  try{return {context,route,pricing:createPricingService(repo),data:await route.list(context)};}catch{notFound();}
}
