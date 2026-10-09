'use server';
import {getVerifiedUser} from '@/modules/auth/identity';
import {getDatabase} from '@/lib/db';
import {createBoardingRepository} from '@/modules/boarding/repository';
import {createSnackRepository} from '@/modules/snack/repository';
import {createSnackService} from '@/modules/snack/service';
import {createSnackActions} from './snack-action-core';
export async function claimSnackAction(tripId:string,input:unknown){const client=getDatabase().$client,service=createSnackService(createSnackRepository(client),createBoardingRepository(client));return createSnackActions({getActor:async()=>{const user=await getVerifiedUser();return user?{userId:user.id,role:'CREW' as const}:null;},claim:service.claim}).claim(tripId,input);}
