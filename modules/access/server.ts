import 'server-only';
import { getVerifiedUser } from '@/modules/auth/identity';
import { getDatabase } from '@/lib/db';
import { createAccessRepository } from './repository';
import { authorize, type Permission } from './service';
export class AccessError extends Error {
  constructor(public readonly reason:'unauthenticated'|'forbidden'|'unavailable') { super(reason === 'unavailable' ? 'Access unavailable' : reason); }
}
export async function ensureVerifiedProfile() {
  const user = await getVerifiedUser();
  if (!user) throw new AccessError('unauthenticated');
  try { await createAccessRepository(getDatabase()).ensureProfile({id:user.id,email:user.email??null}); }
  catch { throw new AccessError('unavailable'); }
}
export async function requireAccess(permission:Permission, companyId?:string):Promise<{userId:string;companyId:string|null}> {
  const user = await getVerifiedUser();
  if (!user) throw new AccessError('unauthenticated');
  const actor = {id:user.id,email:user.email??null};
  let result:ReturnType<typeof authorize>;
  try {
    const repository = createAccessRepository(getDatabase());
    await repository.ensureProfile(actor);
    result = authorize(actor, await repository.listMemberships(actor.id), permission, companyId);
  } catch { throw new AccessError('unavailable'); }
  if (!result.ok) throw new AccessError(result.reason);
  return {userId:actor.id,companyId:permission==='tenant.admin'?companyId!:null};
}
