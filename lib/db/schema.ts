import { sql } from 'drizzle-orm';
import { pgSchema, pgTable, pgEnum, uuid, text, timestamp, integer, bigint, check, uniqueIndex, unique, foreignKey } from 'drizzle-orm/pg-core';

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

export const seatTemplateStatus = pgEnum('seat_template_status', ['ACTIVE', 'ARCHIVED']);
export const seatCellType = pgEnum('seat_cell_type', ['SEAT', 'DRIVER', 'AISLE', 'DOOR', 'EMPTY', 'FACILITY']);
export const vehicleStatus = pgEnum('vehicle_status', ['ACTIVE', 'MAINTENANCE', 'INACTIVE']);
export const seatTemplates = pgTable('seat_templates', {
  id: uuid('id').primaryKey().defaultRandom(), companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'restrict' }),
  name: text('name').notNull(), rows: integer('rows').notNull(), cols: integer('cols').notNull(),
  status: seatTemplateStatus('status').notNull().default('ACTIVE'), version: integer('version').notNull().default(1), ...timestamps(),
}, t => [unique('seat_templates_tenant_key').on(t.id, t.companyId), check('seat_template_dimensions', sql`${t.rows} BETWEEN 1 AND 30 AND ${t.cols} BETWEEN 1 AND 8`), check('seat_template_version', sql`${t.version}>0`), check('seat_template_name', sql`length(trim(${t.name})) BETWEEN 1 AND 120`)]).enableRLS();
export const seatTemplateCells = pgTable('seat_template_cells', {
  id: uuid('id').primaryKey().defaultRandom(), companyId: uuid('company_id').notNull(), seatTemplateId: uuid('seat_template_id').notNull(),
  rowIndex: integer('row_index').notNull(), colIndex: integer('col_index').notNull(), type: seatCellType('type').notNull(), label: text('label'), seatCode: text('seat_code'),
}, t => [
  foreignKey({ columns: [t.seatTemplateId, t.companyId], foreignColumns: [seatTemplates.id, seatTemplates.companyId] }).onDelete('restrict'),
  unique('seat_cell_coordinate').on(t.seatTemplateId, t.rowIndex, t.colIndex), unique('seat_cell_code').on(t.seatTemplateId, t.seatCode),
  check('seat_cell_bounds', sql`${t.rowIndex} BETWEEN 0 AND 29 AND ${t.colIndex} BETWEEN 0 AND 7`),
  check('seat_cell_label', sql`${t.label} IS NULL OR length(${t.label})<=40`),
  check('seat_cell_code_type', sql`(${t.type}='SEAT' AND ${t.seatCode} IS NOT NULL AND ${t.seatCode} ~ '^[A-Z0-9-]{1,8}$') OR (${t.type}<>'SEAT' AND ${t.seatCode} IS NULL)`),
]).enableRLS();
export const vehicles = pgTable('vehicles', {
  id: uuid('id').primaryKey().defaultRandom(), companyId: uuid('company_id').notNull().references(() => companies.id, { onDelete: 'restrict' }),
  name: text('name').notNull(), plateNumber: text('plate_number').notNull(), fleetNumber: text('fleet_number'),
  seatTemplateId: uuid('seat_template_id').notNull(), defaultServiceClassId: uuid('default_service_class_id').notNull(),
  status: vehicleStatus('status').notNull().default('ACTIVE'), revision: integer('revision').notNull().default(1), ...timestamps(),
}, t => [
  unique('vehicles_company_plate').on(t.companyId, t.plateNumber),
  foreignKey({ columns: [t.seatTemplateId, t.companyId], foreignColumns: [seatTemplates.id, seatTemplates.companyId] }).onDelete('restrict'),
  foreignKey({ columns: [t.defaultServiceClassId, t.companyId], foreignColumns: [serviceClasses.id, serviceClasses.companyId] }).onDelete('restrict'),
  check('vehicle_revision', sql`${t.revision}>0`), check('vehicle_name', sql`length(trim(${t.name})) BETWEEN 1 AND 120`),
  check('vehicle_plate', sql`${t.plateNumber} ~ '^[A-Z0-9 -]{1,24}$' AND ${t.plateNumber}=trim(${t.plateNumber}) AND ${t.plateNumber} NOT LIKE '%  %'`),
  check('vehicle_fleet_number', sql`${t.fleetNumber} IS NULL OR length(${t.fleetNumber})<=32`),
]).enableRLS();

export const templateStatus=pgEnum('template_status',['ACTIVE','INACTIVE']);
export const stops=pgTable('stops',{
  id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull().references(()=>companies.id,{onDelete:'restrict'}),name:text('name').notNull(),city:text('city').notNull(),address:text('address'),status:templateStatus('status').notNull().default('ACTIVE'),...timestamps(),
},t=>[unique('stops_tenant_key').on(t.id,t.companyId)]).enableRLS();
export const routes=pgTable('routes',{
  id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull().references(()=>companies.id,{onDelete:'restrict'}),name:text('name').notNull(),code:text('code'),status:templateStatus('status').notNull().default('ACTIVE'),revision:integer('revision').notNull().default(1),...timestamps(),
},t=>[unique('routes_tenant_key').on(t.id,t.companyId),check('route_revision_positive',sql`${t.revision}>0`)]).enableRLS();
export const serviceClasses=pgTable('service_classes',{
  id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull().references(()=>companies.id,{onDelete:'restrict'}),name:text('name').notNull(),code:text('code').notNull(),status:templateStatus('status').notNull().default('ACTIVE'),...timestamps(),
},t=>[unique('classes_tenant_key').on(t.id,t.companyId),unique('classes_company_code').on(t.companyId,t.code)]).enableRLS();
export const routeStops=pgTable('route_stops',{
  id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull(),routeId:uuid('route_id').notNull(),stopId:uuid('stop_id').notNull(),sequence:integer('sequence').notNull(),arrivalOffsetMin:integer('arrival_offset_min'),departureOffsetMin:integer('departure_offset_min'),
},t=>[
  unique('route_stops_endpoint_key').on(t.id,t.routeId,t.companyId),unique('route_stops_sequence').on(t.routeId,t.sequence),unique('route_stops_stop').on(t.routeId,t.stopId),
  foreignKey({columns:[t.routeId,t.companyId],foreignColumns:[routes.id,routes.companyId]}).onDelete('restrict'),foreignKey({columns:[t.stopId,t.companyId],foreignColumns:[stops.id,stops.companyId]}).onDelete('restrict'),
  check('route_stop_sequence_positive',sql`${t.sequence}>=1`),check('route_stop_offsets',sql`(${t.arrivalOffsetMin} IS NULL OR ${t.arrivalOffsetMin} BETWEEN 0 AND 10080) AND (${t.departureOffsetMin} IS NULL OR ${t.departureOffsetMin} BETWEEN 0 AND 10080) AND (${t.arrivalOffsetMin} IS NULL OR ${t.departureOffsetMin} IS NULL OR ${t.arrivalOffsetMin}<=${t.departureOffsetMin})`),
]).enableRLS();
export const segmentFares=pgTable('segment_fares',{
  id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull(),routeId:uuid('route_id').notNull(),fromRouteStopId:uuid('from_route_stop_id').notNull(),toRouteStopId:uuid('to_route_stop_id').notNull(),serviceClassId:uuid('service_class_id').notNull(),price:bigint('price',{mode:'bigint'}).notNull(),currency:text('currency').notNull().default('IDR'),
},t=>[
  unique('fare_segment_class').on(t.routeId,t.fromRouteStopId,t.toRouteStopId,t.serviceClassId),
  foreignKey({columns:[t.fromRouteStopId,t.routeId,t.companyId],foreignColumns:[routeStops.id,routeStops.routeId,routeStops.companyId]}).onDelete('restrict'),foreignKey({columns:[t.toRouteStopId,t.routeId,t.companyId],foreignColumns:[routeStops.id,routeStops.routeId,routeStops.companyId]}).onDelete('restrict'),foreignKey({columns:[t.serviceClassId,t.companyId],foreignColumns:[serviceClasses.id,serviceClasses.companyId]}).onDelete('restrict'),
  check('fare_nonnegative',sql`${t.price}>=0`),check('fare_currency',sql`${t.currency}='IDR'`),check('fare_endpoints_different',sql`${t.fromRouteStopId}<>${t.toRouteStopId}`),
]).enableRLS();
