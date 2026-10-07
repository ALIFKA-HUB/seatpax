export type Actor = { id: string; email: string|null };
export type Permission = 'tenant.admin'|'company.manage';
export type Membership = { userId:string; companyId:string|null; role:'ADMIN_PO'|'CREW'|'SUPER_ADMIN'; status:'ACTIVE'|'DISABLED' };
export function authorize(actor:Actor|null, memberships:Membership[], permission:Permission, companyId?:string): {ok:true}|{ok:false;reason:'unauthenticated'|'forbidden'} {
  if (!actor) return {ok:false,reason:'unauthenticated'};
  const allowed = memberships.some(m => m.userId === actor.id && m.status === 'ACTIVE' && (
    permission === 'company.manage' ? m.role === 'SUPER_ADMIN' && m.companyId === null : permission === 'tenant.admin' && !!companyId && m.role === 'ADMIN_PO' && m.companyId === companyId
  ));
  return allowed ? {ok:true} : {ok:false,reason:'forbidden'};
}
