import { it, expect } from 'vitest';
import { authorize, type Membership } from '@/modules/access/service';
const actor = { id: 'user', email: null };
const member = (role: Membership['role'], companyId: string|null = 'A', status: Membership['status'] = 'ACTIVE'): Membership => ({ userId: 'user', role, companyId, status });
it('rejects anonymous and passenger', () => {
  expect(authorize(null, [], 'tenant.admin', 'A')).toEqual({ok:false,reason:'unauthenticated'});
  expect(authorize(actor, [], 'tenant.admin', 'A')).toEqual({ok:false,reason:'forbidden'});
});
it('admin operates only within exact company', () => {
  expect(authorize(actor, [member('ADMIN_PO')], 'tenant.admin', 'A')).toEqual({ok:true});
  expect(authorize(actor, [member('ADMIN_PO')], 'tenant.admin', 'B').ok).toBe(false);
});
it('finds matching membership regardless of order, user and status', () => {
  expect(authorize(actor, [member('CREW'), member('ADMIN_PO','B'), member('ADMIN_PO')], 'tenant.admin', 'A').ok).toBe(true);
  expect(authorize(actor, [member('ADMIN_PO','A','DISABLED')], 'tenant.admin', 'A').ok).toBe(false);
  expect(authorize(actor, [{...member('ADMIN_PO'),userId:'other'}], 'tenant.admin', 'A').ok).toBe(false);
});
it('super only manages companies, crew cannot bypass trip assignment', () => {
  expect(authorize(actor, [member('SUPER_ADMIN',null)], 'company.manage').ok).toBe(true);
  expect(authorize(actor, [member('SUPER_ADMIN',null)], 'tenant.admin', 'A').ok).toBe(false);
  expect(authorize(actor, [member('CREW')], 'tenant.admin', 'A').ok).toBe(false);
  expect(authorize(actor, [member('CREW')], 'company.manage').ok).toBe(false);
});
it('requires target for tenant and valid global super membership', () => {
  expect(authorize(actor, [member('ADMIN_PO')], 'tenant.admin').ok).toBe(false);
  expect(authorize(actor, [member('SUPER_ADMIN')], 'company.manage').ok).toBe(false);
});
