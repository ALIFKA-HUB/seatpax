import 'server-only';
import {getDatabase} from '@/lib/db';
import {createAccessRepository} from '@/modules/access/repository';
import {validatedReturnPath} from './return-path';

export async function listEntryWorkspaces(userId:string):Promise<{href:string;label:string}[]>{
 const memberships=(await createAccessRepository(getDatabase()).listMemberships(userId)).filter(item=>item.userId===userId&&item.status==='ACTIVE');
 const destinations:{href:string;label:string}[]=[];
 if(memberships.some(item=>item.role==='ADMIN_PO'&&item.companyId!==null))destinations.push({href:'/admin',label:'Admin PO'});
 if(memberships.some(item=>item.role==='CREW'&&item.companyId!==null))destinations.push({href:'/crew',label:'Perjalanan Crew'});
 if(memberships.some(item=>item.role==='SUPER_ADMIN'&&item.companyId===null))destinations.push({href:'/super-admin/companies',label:'Super Admin'});
 return destinations;
}
export async function resolveEntryDestination(userId:string,rawNext:unknown):Promise<string>{
 const next=validatedReturnPath(rawNext);
 if(next)return next;
 const workspaces=await listEntryWorkspaces(userId);
 return workspaces.length>1?'/workspaces':workspaces[0]?.href??'/trips';
}
