import { eq } from 'drizzle-orm';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { users, memberships } from '@/lib/db/schema';
import type { Actor, Membership } from './service';
export function createAccessRepository(db:PostgresJsDatabase) {
  return {
    async ensureProfile(actor:Actor):Promise<void> {
      await db.insert(users).values({id:actor.id,email:actor.email}).onConflictDoNothing({target:users.id});
    },
    async listMemberships(userId:string):Promise<Membership[]> {
      return db.select({userId:memberships.userId,companyId:memberships.companyId,role:memberships.role,status:memberships.status}).from(memberships).where(eq(memberships.userId,userId));
    },
  };
}
