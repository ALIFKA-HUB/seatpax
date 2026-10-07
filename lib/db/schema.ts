import { sql } from 'drizzle-orm';
import { pgSchema, pgTable, pgEnum, uuid, text, timestamp, integer, check, uniqueIndex } from 'drizzle-orm/pg-core';

const authUsers = pgSchema('auth').table('users', { id: uuid('id').primaryKey() });
const timestamps = () => ({ createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow() });
export const companyStatus = pgEnum('company_status', ['ACTIVE', 'SUSPENDED']);
export const membershipStatus = pgEnum('membership_status', ['ACTIVE', 'DISABLED']);
export const membershipRole = pgEnum('membership_role', ['ADMIN_PO', 'CREW', 'SUPER_ADMIN']);
export const users = pgTable('users', {
  id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'restrict' }),
  name: text('name'), avatarUrl: text('avatar_url'), email: text('email'), ...timestamps(),
}).enableRLS();
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(), name: text('name').notNull(), slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'), status: companyStatus('status').notNull().default('ACTIVE'), refundCutoffMinutes: integer('refund_cutoff_minutes'), ...timestamps(),
}, t => [check('company_slug_valid', sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`), check('company_cutoff_valid', sql`${t.refundCutoffMinutes} IS NULL OR ${t.refundCutoffMinutes} >= 0`), check('company_name_valid', sql`length(trim(${t.name})) > 0`)]).enableRLS();
export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'restrict' }),
  role: membershipRole('role').notNull(), status: membershipStatus('status').notNull().default('ACTIVE'), ...timestamps(),
}, t => [
  check('membership_company_role', sql`(${t.role} = 'SUPER_ADMIN' AND ${t.companyId} IS NULL) OR (${t.role} IN ('ADMIN_PO','CREW') AND ${t.companyId} IS NOT NULL)`),
  uniqueIndex('membership_tenant_unique').on(t.userId, t.companyId, t.role).where(sql`${t.companyId} IS NOT NULL`),
  uniqueIndex('membership_global_unique').on(t.userId, t.role).where(sql`${t.companyId} IS NULL`),
]).enableRLS();
