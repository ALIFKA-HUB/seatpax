import 'server-only';
import {redirect} from 'next/navigation';
import {getVerifiedUser} from '@/modules/auth/identity';
import {requireAccess} from '@/modules/access/server';
import {helpdeskConfig} from '@/lib/env/helpdesk';
import {getDatabase} from '@/lib/db';
import {createHelpdeskStaff} from '@/modules/helpdesk/staff';
export async function helpdeskContext(write=false){if(!await getVerifiedUser())redirect('/login');const config=helpdeskConfig();const actor=await requireAccess(write?'helpdesk.write':'helpdesk.read',config.companyId);return {config,ctx:{actorId:actor.userId,companyId:config.companyId},staff:createHelpdeskStaff(getDatabase().$client,config.secret)};}
