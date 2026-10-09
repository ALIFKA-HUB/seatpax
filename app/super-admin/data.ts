import 'server-only';
import {redirect} from 'next/navigation';
import {getVerifiedUser} from '@/modules/auth/identity';
import {getDatabase} from '@/lib/db';
import {createCompanyService} from '@/modules/company/service';
import {createCompanyRepository} from '@/modules/company/repository';
export async function companyData(){const user=await getVerifiedUser();if(!user)redirect('/login');return createCompanyService(createCompanyRepository(getDatabase().$client)).list(user.id);}
