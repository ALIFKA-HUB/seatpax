'use server';
import {getVerifiedUser} from '@/modules/auth/identity';
import {getDatabase} from '@/lib/db';
import {createBoardingRepository} from '@/modules/boarding/repository';
import {createBoardingService} from '@/modules/boarding/service';
import {createBoardingActions} from './boarding-action-core';
function actions(){const service=createBoardingService(createBoardingRepository(getDatabase().$client));return createBoardingActions({getActor:async()=>{const user=await getVerifiedUser();return user?{userId:user.id,role:'CREW' as const}:null;},resolve:service.resolve,board:service.board});}
export async function resolveBoardingAction(tripId:string,token:unknown){return actions().resolve(tripId,token);}
export async function boardPassengerAction(tripId:string,input:unknown){return actions().board(tripId,input);}
