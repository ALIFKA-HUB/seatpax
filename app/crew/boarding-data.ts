import 'server-only';
import {redirect} from 'next/navigation';
import {getVerifiedUser} from '@/modules/auth/identity';
import {getDatabase} from '@/lib/db';
import {createBoardingRepository} from '@/modules/boarding/repository';
import {createBoardingService} from '@/modules/boarding/service';
import {assertManifestCompany} from '@/modules/boarding/validation';
export async function boardingData(role:'CREW'|'ADMIN_PO'='CREW'){const user=await getVerifiedUser();if(!user)redirect('/login');return {actor:{userId:user.id,role},service:createBoardingService(createBoardingRepository(getDatabase().$client))};}
export const enforceManifestCompany=assertManifestCompany;
