import { sql } from 'drizzle-orm';
import { pgSchema, pgTable, pgEnum, uuid, text, timestamp, integer, bigint, jsonb, check, index, uniqueIndex, unique, foreignKey, boolean, date } from 'drizzle-orm/pg-core';

const authUsers = pgSchema('auth').table('users', { id: uuid('id').primaryKey() });
export const holdStatus=pgEnum('hold_status',['ACTIVE','RELEASED','EXPIRED','CONVERTED']);
export const holdAuditAction=pgEnum('hold_audit_action',['HOLD_CREATED','HOLD_RELEASED','HOLD_EXPIRED']);
export const seatHolds=pgTable('seat_holds',{
 id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),tripSeatId:uuid('trip_seat_id').notNull(),
 fromTripStopId:uuid('from_trip_stop_id').notNull(),toTripStopId:uuid('to_trip_stop_id').notNull(),fromSequence:integer('from_sequence').notNull(),toSequence:integer('to_sequence').notNull(),
 heldByUserId:uuid('held_by_user_id').notNull().references(()=>users.id,{onDelete:'restrict'}),requestKey:uuid('request_key').notNull(),status:holdStatus('status').notNull().default('ACTIVE'),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull(),baseExpiresAt:timestamp('base_expires_at',{withTimezone:true}).notNull(),effectiveExpiresAt:timestamp('effective_expires_at',{withTimezone:true}).notNull(),paymentInitiatedAt:timestamp('payment_initiated_at',{withTimezone:true}),releasedAt:timestamp('released_at',{withTimezone:true}),expiredAt:timestamp('expired_at',{withTimezone:true}),
},t=>[unique('hold_owner_request').on(t.heldByUserId,t.requestKey),unique('hold_identity').on(t.id,t.tripId,t.companyId),unique('hold_booker_identity').on(t.id,t.tripId,t.companyId,t.heldByUserId),
 foreignKey({columns:[t.tripSeatId,t.tripId,t.companyId],foreignColumns:[tripSeats.id,tripSeats.tripId,tripSeats.companyId]}).onDelete('restrict'),
 foreignKey({columns:[t.fromTripStopId,t.tripId,t.companyId],foreignColumns:[tripStops.id,tripStops.tripId,tripStops.companyId]}).onDelete('restrict'),
 foreignKey({columns:[t.toTripStopId,t.tripId,t.companyId],foreignColumns:[tripStops.id,tripStops.tripId,tripStops.companyId]}).onDelete('restrict'),
 check('hold_range',sql`${t.fromSequence}>0 AND ${t.toSequence}>${t.fromSequence}`),
 check('hold_times',sql`${t.baseExpiresAt}=${t.createdAt}+interval '10 minutes' AND ${t.effectiveExpiresAt}>=${t.baseExpiresAt} AND (${t.paymentInitiatedAt} IS NULL OR ${t.paymentInitiatedAt}>=${t.createdAt})`),
 check('hold_state',sql`(${t.status} IN ('ACTIVE','CONVERTED') AND ${t.releasedAt} IS NULL AND ${t.expiredAt} IS NULL) OR (${t.status}='RELEASED' AND ${t.releasedAt} IS NOT NULL AND ${t.releasedAt}>=${t.createdAt} AND ${t.expiredAt} IS NULL) OR (${t.status}='EXPIRED' AND ${t.expiredAt} IS NOT NULL AND ${t.expiredAt}>=${t.effectiveExpiresAt} AND ${t.releasedAt} IS NULL)`),
 index('hold_active_seat').on(t.tripId,t.tripSeatId,t.fromSequence,t.toSequence).where(sql`${t.status}='ACTIVE'`),index('hold_expiry').on(t.effectiveExpiresAt).where(sql`${t.status}='ACTIVE'`),
]).enableRLS();
export const seatHoldAuditEvents=pgTable('seat_hold_audit_events',{
 id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),holdId:uuid('hold_id').notNull(),actorId:uuid('actor_id').references(()=>users.id,{onDelete:'restrict'}),action:holdAuditAction('action').notNull(),metadata:jsonb('metadata').notNull(),createdAt:timestamp('created_at',{withTimezone:true}).notNull(),
},t=>[foreignKey({columns:[t.holdId,t.tripId,t.companyId],foreignColumns:[seatHolds.id,seatHolds.tripId,seatHolds.companyId]}).onDelete('restrict'),unique('hold_transition_audit').on(t.holdId,t.action)]).enableRLS();
const timestamps = () => ({ createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(), updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow() });
export const companyStatus = pgEnum('company_status', ['ACTIVE', 'SUSPENDED']);
export const membershipStatus = pgEnum('membership_status', ['ACTIVE', 'DISABLED']);
export const membershipRole = pgEnum('membership_role', ['ADMIN_PO', 'CREW', 'SUPER_ADMIN', 'HELPDESK']);
export const users = pgTable('users', {
  id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'restrict' }),
  name: text('name'), phone: text('phone'), avatarUrl: text('avatar_url'), email: text('email'), ...timestamps(),
}).enableRLS();
export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(), name: text('name').notNull(), slug: text('slug').notNull().unique(),
  logoUrl: text('logo_url'), status: companyStatus('status').notNull().default('ACTIVE'), statusRevision:integer('status_revision').notNull().default(0), refundCutoffMinutes: integer('refund_cutoff_minutes'), ...timestamps(),
}, t => [check('company_status_revision_valid',sql`${t.statusRevision}>=0`),check('company_slug_valid', sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$'`), check('company_cutoff_valid', sql`${t.refundCutoffMinutes} IS NULL OR ${t.refundCutoffMinutes} >= 0`), check('company_name_valid', sql`length(trim(${t.name})) > 0`)]).enableRLS();
export const companyStatusEvents=pgTable('company_status_events',{
 id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull().references(()=>companies.id,{onDelete:'restrict'}),actorUserId:uuid('actor_user_id').notNull().references(()=>users.id,{onDelete:'restrict'}),
 fromStatus:companyStatus('from_status').notNull(),toStatus:companyStatus('to_status').notNull(),statusRevision:integer('status_revision').notNull(),changedAt:timestamp('changed_at',{withTimezone:true}).notNull().default(sql`clock_timestamp()`),
},t=>[check('company_event_changed',sql`${t.fromStatus}<>${t.toStatus}`),check('company_event_revision_positive',sql`${t.statusRevision}>0`),unique('company_event_revision').on(t.companyId,t.statusRevision)]).enableRLS();
export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(), userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'restrict' }),
  companyId: uuid('company_id').references(() => companies.id, { onDelete: 'restrict' }),
  role: membershipRole('role').notNull(), status: membershipStatus('status').notNull().default('ACTIVE'), ...timestamps(),
}, t => [
  check('membership_company_role', sql`(${t.role} = 'SUPER_ADMIN' AND ${t.companyId} IS NULL) OR (${t.role}::text IN ('ADMIN_PO','CREW','HELPDESK') AND ${t.companyId} IS NOT NULL)`),
  uniqueIndex('membership_tenant_unique').on(t.userId, t.companyId, t.role).where(sql`${t.companyId} IS NOT NULL`),
  uniqueIndex('membership_global_unique').on(t.userId, t.role).where(sql`${t.companyId} IS NULL`),
  unique('membership_trip_identity').on(t.id,t.userId,t.companyId,t.role),
]).enableRLS();

export const tripStatus=pgEnum('trip_status',['DRAFT','OPEN_FOR_SALE']);
export const crewAssignmentStatus=pgEnum('crew_assignment_status',['ACTIVE','REVOKED']);
export const tripAuditAction=pgEnum('trip_audit_action',['PUBLICATION','CREW_ASSIGNED','CREW_REVOKED']);
export const trips=pgTable('trips',{
 id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull().references(()=>companies.id,{onDelete:'restrict'}),name:text('name').notNull(),
 routeId:uuid('route_id').notNull(),vehicleId:uuid('vehicle_id').notNull(),serviceClassId:uuid('service_class_id').notNull(),
 departureAt:timestamp('departure_at',{withTimezone:true}).notNull(),salesCloseAt:timestamp('sales_close_at',{withTimezone:true}),
 revision:integer('revision').notNull().default(1),status:tripStatus('status').notNull().default('DRAFT'),publishedAt:timestamp('published_at',{withTimezone:true}),layoutSnapshot:jsonb('layout_snapshot'),identitySnapshot:jsonb('identity_snapshot'),...timestamps(),
},t=>[unique('trips_tenant_key').on(t.id,t.companyId),
 foreignKey({columns:[t.routeId,t.companyId],foreignColumns:[routes.id,routes.companyId]}).onDelete('restrict'),
 foreignKey({columns:[t.vehicleId,t.companyId],foreignColumns:[vehicles.id,vehicles.companyId]}).onDelete('restrict'),
 foreignKey({columns:[t.serviceClassId,t.companyId],foreignColumns:[serviceClasses.id,serviceClasses.companyId]}).onDelete('restrict'),
 check('trip_revision_positive',sql`${t.revision}>0`),check('trip_name_valid',sql`length(trim(${t.name})) BETWEEN 1 AND 120`),
 check('trip_publication_state',sql`(${t.status}='DRAFT' AND ${t.publishedAt} IS NULL AND ${t.layoutSnapshot} IS NULL AND ${t.identitySnapshot} IS NULL) OR (${t.status}='OPEN_FOR_SALE' AND ${t.publishedAt} IS NOT NULL AND ${t.layoutSnapshot} IS NOT NULL AND ${t.identitySnapshot} IS NOT NULL)`),
]).enableRLS();
export const tripStops=pgTable('trip_stops',{
 id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),sourceId:uuid('source_id').notNull(),stopId:uuid('stop_id').notNull(),
 name:text('name').notNull(),city:text('city').notNull(),address:text('address'),sequence:integer('sequence').notNull(),arrivalAt:timestamp('arrival_at',{withTimezone:true}).notNull(),departureAt:timestamp('departure_at',{withTimezone:true}).notNull(),
},t=>[foreignKey({columns:[t.tripId,t.companyId],foreignColumns:[trips.id,trips.companyId]}).onDelete('restrict'),unique('trip_stop_identity').on(t.id,t.tripId,t.companyId),unique('trip_stop_sequence').on(t.tripId,t.sequence),check('trip_stop_positive',sql`${t.sequence}>0`),check('trip_stop_time_order',sql`${t.arrivalAt}<=${t.departureAt}`)]).enableRLS();
export const tripSegments=pgTable('trip_segments',{
 id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),fromTripStopId:uuid('from_trip_stop_id').notNull(),toTripStopId:uuid('to_trip_stop_id').notNull(),sequence:integer('sequence').notNull(),price:bigint('price',{mode:'bigint'}).notNull(),currency:text('currency').notNull().default('IDR'),
},t=>[unique('trip_segment_identity').on(t.id,t.tripId,t.companyId),unique('trip_segment_sequence').on(t.tripId,t.sequence),
 foreignKey({columns:[t.fromTripStopId,t.tripId,t.companyId],foreignColumns:[tripStops.id,tripStops.tripId,tripStops.companyId]}).onDelete('restrict'),foreignKey({columns:[t.toTripStopId,t.tripId,t.companyId],foreignColumns:[tripStops.id,tripStops.tripId,tripStops.companyId]}).onDelete('restrict'),
 check('trip_segment_values',sql`${t.sequence}>0 AND ${t.price}>=0 AND ${t.currency}='IDR' AND ${t.fromTripStopId}<>${t.toTripStopId}`),
]).enableRLS();
export const tripSeats=pgTable('trip_seats',{
 id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),seatCode:text('seat_code').notNull(),rowIndex:integer('row_index').notNull(),colIndex:integer('col_index').notNull(),label:text('label'),
},t=>[foreignKey({columns:[t.tripId,t.companyId],foreignColumns:[trips.id,trips.companyId]}).onDelete('restrict'),unique('trip_seat_identity').on(t.id,t.tripId,t.companyId),unique('trip_seat_code').on(t.tripId,t.seatCode),unique('trip_seat_coordinate').on(t.tripId,t.rowIndex,t.colIndex),check('trip_seat_values',sql`${t.rowIndex} BETWEEN 0 AND 29 AND ${t.colIndex} BETWEEN 0 AND 7 AND ${t.seatCode} ~ '^[A-Z0-9-]{1,8}$'`)]).enableRLS();
export const tripSeatInventory=pgTable('trip_seat_inventory',{
 id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),tripSeatId:uuid('trip_seat_id').notNull(),tripSegmentId:uuid('trip_segment_id').notNull(),
},t=>[unique('trip_inventory_unit').on(t.tripId,t.tripSeatId,t.tripSegmentId),foreignKey({columns:[t.tripSeatId,t.tripId,t.companyId],foreignColumns:[tripSeats.id,tripSeats.tripId,tripSeats.companyId]}).onDelete('restrict'),foreignKey({columns:[t.tripSegmentId,t.tripId,t.companyId],foreignColumns:[tripSegments.id,tripSegments.tripId,tripSegments.companyId]}).onDelete('restrict'),unique('inventory_tenant_identity').on(t.id,t.tripId,t.companyId)]).enableRLS();
export const tripCrewAssignments=pgTable('trip_crew_assignments',{
 id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),userId:uuid('user_id').notNull(),membershipId:uuid('membership_id').notNull(),membershipRole:membershipRole('membership_role').notNull().default('CREW'),status:crewAssignmentStatus('status').notNull().default('ACTIVE'),assignedBy:uuid('assigned_by').notNull().references(()=>users.id,{onDelete:'restrict'}),assignedAt:timestamp('assigned_at',{withTimezone:true}).notNull().defaultNow(),revokedAt:timestamp('revoked_at',{withTimezone:true}),
},t=>[unique('trip_crew_pair').on(t.tripId,t.userId),foreignKey({columns:[t.tripId,t.companyId],foreignColumns:[trips.id,trips.companyId]}).onDelete('restrict'),foreignKey({columns:[t.membershipId,t.userId,t.companyId,t.membershipRole],foreignColumns:[memberships.id,memberships.userId,memberships.companyId,memberships.role]}).onDelete('restrict'),check('trip_crew_role',sql`${t.membershipRole}='CREW'`),check('trip_crew_revocation',sql`(${t.status}='ACTIVE' AND ${t.revokedAt} IS NULL) OR (${t.status}='REVOKED' AND ${t.revokedAt} IS NOT NULL)`)]).enableRLS();
export const tripAuditEvents=pgTable('trip_audit_events',{
 id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),actorId:uuid('actor_id').notNull().references(()=>users.id,{onDelete:'restrict'}),action:tripAuditAction('action').notNull(),targetUserId:uuid('target_user_id').references(()=>users.id,{onDelete:'restrict'}),metadata:jsonb('metadata').notNull(),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
},t=>[foreignKey({columns:[t.tripId,t.companyId],foreignColumns:[trips.id,trips.companyId]}).onDelete('restrict')]).enableRLS();

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
  unique('vehicles_tenant_key').on(t.id,t.companyId),
  foreignKey({ columns: [t.seatTemplateId, t.companyId], foreignColumns: [seatTemplates.id, seatTemplates.companyId] }).onDelete('restrict'),
  foreignKey({ columns: [t.defaultServiceClassId, t.companyId], foreignColumns: [serviceClasses.id, serviceClasses.companyId] }).onDelete('restrict'),
  check('vehicle_revision', sql`${t.revision}>0`), check('vehicle_name', sql`length(trim(${t.name})) BETWEEN 1 AND 120`),
  check('vehicle_plate', sql`${t.plateNumber} ~ '^[A-Z0-9 -]{1,24}$' AND ${t.plateNumber}=trim(${t.plateNumber}) AND ${t.plateNumber} NOT LIKE '%  %'`),
  check('vehicle_fleet_number', sql`${t.fleetNumber} IS NULL OR length(${t.fleetNumber})<=32`),
]).enableRLS();

export const templateStatus=pgEnum('template_status',['ACTIVE','INACTIVE']);
export const regionImportState=pgEnum('region_import_state',['FETCHING','SUCCEEDED','FAILED']);
export const regionImportRuns=pgTable('region_import_runs',{
 id:uuid('id').primaryKey().defaultRandom(),provider:text('provider').notNull(),state:regionImportState('state').notNull(),sourceUrls:text('source_urls').array().notNull(),
 upstreamDate:date('upstream_date'),retrievedAt:timestamp('retrieved_at',{withTimezone:true}).notNull(),finishedAt:timestamp('finished_at',{withTimezone:true}),digest:text('digest'),
 provinceCount:integer('province_count').notNull().default(0),regencyCount:integer('regency_count').notNull().default(0),failureCode:text('failure_code'),
},t=>[index('region_runs_provider_date').on(t.provider,t.upstreamDate),check('region_counts_valid',sql`${t.provinceCount}>=0 AND ${t.regencyCount}>=0`),check('region_digest_valid',sql`${t.digest} IS NULL OR ${t.digest} ~ '^[a-f0-9]{64}$'`)]).enableRLS();
export const regionProvinces=pgTable('region_provinces',{
 id:uuid('id').primaryKey().defaultRandom(),provider:text('provider').notNull(),code:text('code').notNull(),name:text('name').notNull(),active:boolean('active').notNull(),lastSeenRunId:uuid('last_seen_run_id').notNull().references(()=>regionImportRuns.id,{onDelete:'restrict'}),
},t=>[unique('region_province_code').on(t.provider,t.code),unique('region_province_provider_id').on(t.provider,t.id),index('region_province_run').on(t.lastSeenRunId)]).enableRLS();
export const regionRegencies=pgTable('region_regencies',{
 id:uuid('id').primaryKey().defaultRandom(),provider:text('provider').notNull(),code:text('code').notNull(),name:text('name').notNull(),provinceId:uuid('province_id').notNull(),active:boolean('active').notNull(),lastSeenRunId:uuid('last_seen_run_id').notNull().references(()=>regionImportRuns.id,{onDelete:'restrict'}),
},t=>[unique('region_regency_code').on(t.provider,t.code),foreignKey({columns:[t.provider,t.provinceId],foreignColumns:[regionProvinces.provider,regionProvinces.id]}).onDelete('restrict'),index('region_regency_province').on(t.provinceId),index('region_regency_run').on(t.lastSeenRunId)]).enableRLS();
export const stops=pgTable('stops',{
  id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull().references(()=>companies.id,{onDelete:'restrict'}),name:text('name').notNull(),city:text('city').notNull(),address:text('address'),status:templateStatus('status').notNull().default('ACTIVE'),...timestamps(),
  regionRegencyId:uuid('region_regency_id').references(()=>regionRegencies.id,{onDelete:'restrict'}),
},t=>[unique('stops_tenant_key').on(t.id,t.companyId),index('stops_region_regency').on(t.regionRegencyId)]).enableRLS();
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
// Checkout/payment constraints are applied by 0006_checkout_payment.sql.
export const bookings=pgTable('bookings',{
 id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),seatHoldId:uuid('seat_hold_id').notNull().unique(),bookerUserId:uuid('booker_user_id').notNull(),requestKey:uuid('request_key').notNull(),payloadHash:text('payload_hash').notNull(),mode:text('mode').notNull(),contactEmail:text('contact_email').notNull(),amount:bigint('amount',{mode:'bigint'}).notNull(),snapshot:jsonb('snapshot').notNull(),status:text('status').notNull().default('PENDING_PAYMENT'),createdAt:timestamp('created_at',{withTimezone:true}).notNull().default(sql`clock_timestamp()`),confirmedAt:timestamp('confirmed_at',{withTimezone:true}),
},t=>[unique('bookings_booker_user_id_request_key_key').on(t.bookerUserId,t.requestKey),unique('bookings_id_trip_id_company_id_key').on(t.id,t.tripId,t.companyId),unique('bookings_id_trip_id_company_id_booker_user_id_mode_key').on(t.id,t.tripId,t.companyId,t.bookerUserId,t.mode),foreignKey({columns:[t.bookerUserId],foreignColumns:[users.id]}).onDelete('restrict'),foreignKey({columns:[t.seatHoldId,t.tripId,t.companyId,t.bookerUserId],foreignColumns:[seatHolds.id,seatHolds.tripId,seatHolds.companyId,seatHolds.heldByUserId]}).onDelete('restrict'),check('bookings_mode_check',sql`${t.mode} IN ('SELF','OTHER')`),check('bookings_amount_check',sql`${t.amount}>0 AND ${t.amount}<=9007199254740991`),check('bookings_snapshot_check',sql`jsonb_typeof(${t.snapshot})='object'`),check('bookings_status_check',sql`${t.status} IN ('PENDING_PAYMENT','EXPIRED','CONFIRMED','PAYMENT_CONFLICT','REFUNDED')`),check('bookings_check',sql`(${t.status}='CONFIRMED' AND ${t.confirmedAt} IS NOT NULL AND ${t.confirmedAt}>=${t.createdAt}) OR (${t.status}<>'CONFIRMED' AND ${t.confirmedAt} IS NULL)`),index('booking_owner_time').on(t.bookerUserId,t.createdAt.desc()),index('booking_conflict_company').on(t.companyId).where(sql`${t.status}='PAYMENT_CONFLICT'`)]).enableRLS();
export const bookingPassengers=pgTable('booking_passengers',{
 id:uuid('id').primaryKey().defaultRandom(),bookingId:uuid('booking_id').notNull().unique(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),bookerUserId:uuid('booker_user_id').notNull(),mode:text('mode').notNull(),accountId:uuid('account_id'),name:text('name').notNull(),phone:text('phone').notNull(),
},t=>[unique('booking_passengers_id_trip_id_company_id_key').on(t.id,t.tripId,t.companyId),foreignKey({columns:[t.accountId],foreignColumns:[users.id]}).onDelete('restrict'),foreignKey({columns:[t.bookingId,t.tripId,t.companyId,t.bookerUserId,t.mode],foreignColumns:[bookings.id,bookings.tripId,bookings.companyId,bookings.bookerUserId,bookings.mode]}).onDelete('restrict'),check('booking_passengers_name_check',sql`length(trim(${t.name})) BETWEEN 1 AND 120`),check('booking_passengers_phone_check',sql`${t.phone} ~ '^\\+[1-9][0-9]{7,14}$'`),check('booking_passengers_check',sql`(${t.mode}='SELF' AND ${t.accountId} IS NOT NULL AND ${t.accountId}=${t.bookerUserId}) OR (${t.mode}='OTHER' AND ${t.accountId} IS NULL)`)]).enableRLS();
export const payments=pgTable('payments',{
 id:uuid('id').primaryKey().defaultRandom(),bookingId:uuid('booking_id').notNull().unique(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),providerOrderId:text('provider_order_id').notNull().unique(),amount:bigint('amount',{mode:'bigint'}).notNull(),status:text('status').notNull().default('PENDING'),paidAt:timestamp('paid_at',{withTimezone:true}),providerTransactionId:text('provider_transaction_id').unique(),providerStatus:text('provider_status'),creationState:text('creation_state').notNull().default('NOT_STARTED'),creationLease:uuid('creation_lease'),creationLeaseUntil:timestamp('creation_lease_until',{withTimezone:true}),snapToken:text('snap_token'),snapRedirectUrl:text('snap_redirect_url'),createdAt:timestamp('created_at',{withTimezone:true}).notNull().default(sql`clock_timestamp()`),lastError:text('last_error'),
},t=>[unique('payments_id_trip_id_company_id_key').on(t.id,t.tripId,t.companyId),foreignKey({columns:[t.bookingId,t.tripId,t.companyId],foreignColumns:[bookings.id,bookings.tripId,bookings.companyId]}).onDelete('restrict'),check('payments_amount_check',sql`${t.amount}>0`),check('payments_status_check',sql`${t.status} IN ('PENDING','PAID','FAILED','EXPIRED')`),check('payments_creation_state_check',sql`${t.creationState} IN ('NOT_STARTED','CREATING','READY','UNKNOWN')`),check('payments_check',sql`(${t.status}='PAID' AND ${t.paidAt} IS NOT NULL) OR (${t.status}<>'PAID' AND ${t.paidAt} IS NULL)`),check('payments_check1',sql`(${t.creationState}='READY' AND ${t.snapToken} IS NOT NULL AND ${t.snapRedirectUrl} IS NOT NULL) OR ${t.creationState}<>'READY'`)]).enableRLS();
export const paymentEvents=pgTable('payment_events',{
 id:uuid('id').primaryKey().defaultRandom(),paymentId:uuid('payment_id').notNull(),eventKey:text('event_key').notNull().unique(),fields:jsonb('fields').notNull(),receivedAt:timestamp('received_at',{withTimezone:true}).notNull().default(sql`clock_timestamp()`),verifiedObservation:jsonb('verified_observation'),verifiedAt:timestamp('verified_at',{withTimezone:true}),status:text('status').notNull().default('RECEIVED'),attempts:integer('attempts').notNull().default(0),leaseId:uuid('lease_id'),leaseUntil:timestamp('lease_until',{withTimezone:true}),nextAttemptAt:timestamp('next_attempt_at',{withTimezone:true}).notNull().default(sql`clock_timestamp()`),processedAt:timestamp('processed_at',{withTimezone:true}),lastError:text('last_error'),
},t=>[foreignKey({columns:[t.paymentId],foreignColumns:[payments.id]}).onDelete('restrict'),check('payment_events_fields_check',sql`jsonb_typeof(${t.fields})='object'`),check('payment_events_status_check',sql`${t.status} IN ('RECEIVED','PROCESSED','IGNORED','REVIEW')`),check('payment_events_attempts_check',sql`${t.attempts} BETWEEN 0 AND 8`),check('payment_events_check',sql`(${t.status} IN ('PROCESSED','IGNORED') AND ${t.processedAt} IS NOT NULL) OR (${t.status} IN ('RECEIVED','REVIEW') AND ${t.processedAt} IS NULL)`),index('event_pending_replay').on(t.nextAttemptAt).where(sql`${t.status}='RECEIVED'`)]).enableRLS();
export const seatAssignments=pgTable('seat_assignments',{
 id:uuid('id').primaryKey().defaultRandom(),bookingPassengerId:uuid('booking_passenger_id').notNull().unique(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),tripSeatId:uuid('trip_seat_id').notNull(),fromSequence:integer('from_sequence').notNull(),toSequence:integer('to_sequence').notNull(),assignedAt:timestamp('assigned_at',{withTimezone:true}).notNull().default(sql`clock_timestamp()`),
},t=>[unique('assignment_passenger_identity').on(t.id,t.bookingPassengerId,t.tripId,t.companyId),unique('seat_assignments_id_trip_id_company_id_key').on(t.id,t.tripId,t.companyId),foreignKey({columns:[t.bookingPassengerId,t.tripId,t.companyId],foreignColumns:[bookingPassengers.id,bookingPassengers.tripId,bookingPassengers.companyId]}).onDelete('restrict'),foreignKey({columns:[t.tripSeatId,t.tripId,t.companyId],foreignColumns:[tripSeats.id,tripSeats.tripId,tripSeats.companyId]}).onDelete('restrict'),check('seat_assignments_check',sql`${t.fromSequence}>0 AND ${t.toSequence}>${t.fromSequence}`),index('assignment_interval').on(t.tripId,t.tripSeatId,t.fromSequence,t.toSequence)]).enableRLS();
export const confirmedOccupancy=pgTable('confirmed_occupancy',{inventoryId:uuid('inventory_id').primaryKey(),assignmentId:uuid('assignment_id').notNull(),tripId:uuid('trip_id').notNull(),companyId:uuid('company_id').notNull()},t=>[foreignKey({columns:[t.inventoryId,t.tripId,t.companyId],foreignColumns:[tripSeatInventory.id,tripSeatInventory.tripId,tripSeatInventory.companyId]}).onDelete('restrict'),foreignKey({columns:[t.assignmentId,t.tripId,t.companyId],foreignColumns:[seatAssignments.id,seatAssignments.tripId,seatAssignments.companyId]}).onDelete('restrict')]).enableRLS();
export const tickets=pgTable('tickets',{
 id:uuid('id').primaryKey().defaultRandom(),bookingPassengerId:uuid('booking_passenger_id').notNull().unique(),assignmentId:uuid('assignment_id').notNull().unique(),tripId:uuid('trip_id').notNull(),companyId:uuid('company_id').notNull(),tokenHash:text('token_hash').notNull().unique(),ciphertext:text('ciphertext').notNull(),nonce:text('nonce').notNull(),authTag:text('auth_tag').notNull(),keyVersion:text('key_version').notNull(),createdAt:timestamp('created_at',{withTimezone:true}).notNull().default(sql`clock_timestamp()`),
},t=>[unique('tickets_trip_company_identity').on(t.id,t.tripId,t.companyId),foreignKey({columns:[t.bookingPassengerId,t.tripId,t.companyId],foreignColumns:[bookingPassengers.id,bookingPassengers.tripId,bookingPassengers.companyId]}).onDelete('restrict'),foreignKey({columns:[t.assignmentId,t.tripId,t.companyId],foreignColumns:[seatAssignments.id,seatAssignments.tripId,seatAssignments.companyId]}).onDelete('restrict'),foreignKey({name:'ticket_assignment_passenger_identity',columns:[t.assignmentId,t.bookingPassengerId,t.tripId,t.companyId],foreignColumns:[seatAssignments.id,seatAssignments.bookingPassengerId,seatAssignments.tripId,seatAssignments.companyId]}).onDelete('restrict'),check('tickets_token_hash_check',sql`length(${t.tokenHash})=64`)]).enableRLS();
export const boardingEvents=pgTable('boarding_events',{
 id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),ticketId:uuid('ticket_id').notNull(),boardingStopId:uuid('boarding_stop_id').notNull(),actorUserId:uuid('actor_user_id').notNull().references(()=>users.id,{onDelete:'restrict'}),source:text('source').notNull(),boardedAt:timestamp('boarded_at',{withTimezone:true}).notNull().default(sql`clock_timestamp()`),
},t=>[unique('boarding_once').on(t.ticketId,t.tripId),unique('boarding_ticket_trip_company').on(t.ticketId,t.tripId,t.companyId),foreignKey({name:'boarding_ticket_identity',columns:[t.ticketId,t.tripId,t.companyId],foreignColumns:[tickets.id,tickets.tripId,tickets.companyId]}).onDelete('restrict'),foreignKey({name:'boarding_stop_identity',columns:[t.boardingStopId,t.tripId,t.companyId],foreignColumns:[tripStops.id,tripStops.tripId,tripStops.companyId]}).onDelete('restrict'),check('boarding_source',sql`${t.source} IN ('QR','MANIFEST')`)]).enableRLS();
export const paymentResolutions=pgTable('payment_resolutions',{
 id:uuid('id').primaryKey().defaultRandom(),bookingId:uuid('booking_id').notNull().unique(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),actorId:uuid('actor_id').notNull(),requestKey:uuid('request_key').notNull(),action:text('action').notNull(),amount:bigint('amount',{mode:'bigint'}).notNull(),reason:text('reason').notNull(),createdAt:timestamp('created_at',{withTimezone:true}).notNull().default(sql`clock_timestamp()`),
},t=>[foreignKey({columns:[t.actorId],foreignColumns:[users.id]}).onDelete('restrict'),foreignKey({columns:[t.bookingId,t.tripId,t.companyId],foreignColumns:[bookings.id,bookings.tripId,bookings.companyId]}).onDelete('restrict'),check('payment_resolutions_action_check',sql`${t.action} IN ('CONFIRM','MOCK_REFUND')`),check('payment_resolutions_amount_check',sql`${t.amount}>0`),check('payment_resolutions_reason_check',sql`length(trim(${t.reason})) BETWEEN 1 AND 500`)]).enableRLS();
export const bookingAuditEvents=pgTable('booking_audit_events',{
 id:uuid('id').primaryKey().defaultRandom(),bookingId:uuid('booking_id').notNull(),action:text('action').notNull(),actorId:uuid('actor_id'),metadata:jsonb('metadata').notNull().default(sql`'{}'::jsonb`),createdAt:timestamp('created_at',{withTimezone:true}).notNull().default(sql`clock_timestamp()`),
},t=>[foreignKey({columns:[t.bookingId],foreignColumns:[bookings.id]}).onDelete('restrict'),foreignKey({columns:[t.actorId],foreignColumns:[users.id]}).onDelete('restrict'),unique('booking_audit_events_booking_id_action_key').on(t.bookingId,t.action)]).enableRLS();


export const snackClaims=pgTable('snack_claims',{
 id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),ticketId:uuid('ticket_id').notNull(),actorUserId:uuid('actor_user_id').notNull().references(()=>users.id,{onDelete:'restrict'}),claimedAt:timestamp('claimed_at',{withTimezone:true}).notNull().default(sql`clock_timestamp()`),
},t=>[unique('snack_once').on(t.ticketId,t.tripId),foreignKey({name:'snack_ticket_identity',columns:[t.ticketId,t.tripId,t.companyId],foreignColumns:[tickets.id,tickets.tripId,tickets.companyId]}).onDelete('restrict'),foreignKey({name:'snack_boarding_identity',columns:[t.ticketId,t.tripId,t.companyId],foreignColumns:[boardingEvents.ticketId,boardingEvents.tripId,boardingEvents.companyId]}).onDelete('restrict')]).enableRLS();

// Helpdesk tables are server-only domain data. SQL migration owns their check constraints.
export const helpdeskCases=pgTable('helpdesk_cases',{
 id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull().references(()=>companies.id),code:text('code').notNull().unique(),requestKey:uuid('request_key').notNull().unique(),payloadHash:text('payload_hash').notNull(),name:text('name').notNull(),email:text('email').notNull(),category:text('category').notNull(),title:text('title').notNull(),description:text('description').notNull(),bookingReference:text('booking_reference'),status:text('status').notNull().default('MENUNGGU'),priority:text('priority'),revision:integer('revision').notNull().default(0),publicRequest:text('public_request'),publicOutcome:text('public_outcome'),...timestamps(),
}).enableRLS();
export const helpdeskEvents=pgTable('helpdesk_events',{id:uuid('id').primaryKey().defaultRandom(),caseId:uuid('case_id').notNull().references(()=>helpdeskCases.id),companyId:uuid('company_id').notNull(),revision:integer('revision').notNull(),kind:text('kind').notNull(),actorId:uuid('actor_id').references(()=>users.id),note:text('note'),requestKey:uuid('request_key').unique(),payloadHash:text('payload_hash'),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()}).enableRLS();
export const helpdeskGrants=pgTable('helpdesk_grants',{id:uuid('id').primaryKey(),caseId:uuid('case_id').notNull().references(()=>helpdeskCases.id),eventId:uuid('event_id').notNull().references(()=>helpdeskEvents.id),digest:text('digest').notNull(),consumedAt:timestamp('consumed_at',{withTimezone:true}),revokedAt:timestamp('revoked_at',{withTimezone:true})}).enableRLS();
export const helpdeskAttachments=pgTable('helpdesk_attachments',{id:uuid('id').primaryKey().defaultRandom(),caseId:uuid('case_id').notNull().references(()=>helpdeskCases.id),eventId:uuid('event_id').notNull().references(()=>helpdeskEvents.id),path:text('path').notNull().unique(),name:text('name').notNull(),mime:text('mime').notNull(),size:integer('size').notNull()}).enableRLS();
export const helpdeskMailJobs=pgTable('helpdesk_mail_jobs',{id:uuid('id').primaryKey().defaultRandom(),eventId:uuid('event_id').notNull().unique().references(()=>helpdeskEvents.id),caseId:uuid('case_id').notNull().references(()=>helpdeskCases.id),payload:jsonb('payload').notNull(),state:text('state').notNull().default('QUEUED'),attempts:integer('attempts').notNull().default(0),nextAttemptAt:timestamp('next_attempt_at',{withTimezone:true}).notNull().defaultNow(),firstAttemptAt:timestamp('first_attempt_at',{withTimezone:true}),leaseUntil:timestamp('lease_until',{withTimezone:true}),providerId:text('provider_id'),errorCode:text('error_code'),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow()}).enableRLS();
export const helpdeskRateLimits=pgTable('helpdesk_rate_limits',{key:text('key').notNull(),windowStart:bigint('window_start',{mode:'number'}).notNull(),count:integer('count').notNull()}).enableRLS();
