export type Actor = { id: string; email: string|null };
export type Permission = 'tenant.admin'|'company.manage'|'helpdesk.read'|'helpdesk.write';
export type Membership = { userId:string; companyId:string|null; role:'ADMIN_PO'|'CREW'|'SUPER_ADMIN'|'HELPDESK'; status:'ACTIVE'|'DISABLED' };
export function authorize(actor:Actor|null, memberships:Membership[], permission:Permission, companyId?:string): {ok:true}|{ok:false;reason:'unauthenticated'|'forbidden'} {
  if (!actor) return {ok:false,reason:'unauthenticated'};
  const allowed = memberships.some(m => m.userId === actor.id && m.status === 'ACTIVE' && (
    permission === 'company.manage' ? m.role === 'SUPER_ADMIN' && m.companyId === null : !!companyId && m.companyId === companyId && (permission === 'tenant.admin' && m.role === 'ADMIN_PO' || permission === 'helpdesk.write' && m.role === 'HELPDESK' || permission === 'helpdesk.read' && (m.role === 'HELPDESK'||m.role === 'ADMIN_PO'))
  ));
  return allowed ? {ok:true} : {ok:false,reason:'forbidden'};
}
