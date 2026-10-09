'use server';
import {getVerifiedUser} from '@/modules/auth/identity';
import {getDatabase} from '@/lib/db';
import {createCompanyService} from '@/modules/company/service';
import {createCompanyRepository} from '@/modules/company/repository';
import {createCompanyActions} from './action-core';
export async function changeCompanyStatusAction(raw:unknown){return createCompanyActions({getUserId:async()=>(await getVerifiedUser())?.id??null,changeStatus:(id,input)=>createCompanyService(createCompanyRepository(getDatabase().$client)).changeStatus(id,input)}).change(raw);}
