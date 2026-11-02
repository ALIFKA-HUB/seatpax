import 'server-only';
import {redirect} from 'next/navigation';
import {getVerifiedUser} from '@/modules/auth/identity';
import {getDatabase} from '@/lib/db';
import {DomainError} from '@/modules/access/transaction';
import {createStaffDirectoryRepository} from '@/modules/staff-directory/repository';
import {createStaffDirectoryService} from '@/modules/staff-directory/service';
import {parseDirectoryQuery,resolveDirectoryCompany} from '@/modules/staff-directory/validation';

export async function dashboardData(raw:{q?:unknown;status?:unknown;page?:unknown}){
 const user=await getVerifiedUser();if(!user)redirect('/login');
 const companyId=resolveDirectoryCompany(process.env);
 try{return await createStaffDirectoryService(createStaffDirectoryRepository(getDatabase().$client)).read(user.id,companyId,parseDirectoryQuery(raw));}
 catch(error){if(error instanceof DomainError)throw error;throw new DomainError('unavailable','Data petugas belum dapat dimuat.');}
}
