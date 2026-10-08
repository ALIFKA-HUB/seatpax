import { sql } from 'drizzle-orm';
import { pgSchema, pgTable, pgEnum, uuid, text, timestamp, integer, bigint, jsonb, check, index, uniqueIndex, unique, foreignKey } from 'drizzle-orm/pg-core';

const authUsers = pgSchema('auth').table('users', { id: uuid('id').primaryKey() });
export const holdStatus=pgEnum('hold_status',['ACTIVE','RELEASED','EXPIRED','CONVERTED']);
export const holdAuditAction=pgEnum('hold_audit_action',['HOLD_CREATED','HOLD_RELEASED','HOLD_EXPIRED']);
export const seatHolds=pgTable('seat_holds',{
 id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),tripSeatId:uuid('trip_seat_id').notNull(),
 fromTripStopId:uuid('from_trip_stop_id').notNull(),toTripStopId:uuid('to_trip_stop_id').notNull(),fromSequence:integer('from_sequence').notNull(),toSequence:integer('to_sequence').notNull(),
 heldByUserId:uuid('held_by_user_id').notNull().references(()=>users.id,{onDelete:'restrict'}),requestKey:uuid('request_key').notNull(),status:holdStatus('status').notNull().default('ACTIVE'),
 createdAt:timestamp('created_at',{withTimezone:true}).notNull(),baseExpiresAt:timestamp('base_expires_at',{withTimezone:true}).notNull(),effectiveExpiresAt:timestamp('effective_expires_at',{withTimezone:true}).notNull(),paymentInitiatedAt:timestamp('payment_initiated_at',{withTimezone:true}),releasedAt:timestamp('released_at',{withTimezone:true}),expiredAt:timestamp('expired_at',{withTimezone:true}),
},t=>[unique('hold_owner_request').on(t.heldByUserId,t.requestKey),unique('hold_identity').on(t.id,t.tripId,t.companyId),
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
export const membershipRole = pgEnum('membership_role', ['ADMIN_PO', 'CREW', 'SUPER_ADMIN']);
export const users = pgTable('users', {
  id: uuid('id').primaryKey().references(() => authUsers.id, { onDelete: 'restrict' }),
  name: text('name'), phone: text('phone'), avatarUrl: text('avatar_url'), email: text('email'), ...timestamps(),
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
},t=>[unique('trip_inventory_unit').on(t.tripId,t.tripSeatId,t.tripSegmentId),foreignKey({columns:[t.tripSeatId,t.tripId,t.companyId],foreignColumns:[tripSeats.id,tripSeats.tripId,tripSeats.companyId]}).onDelete('restrict'),foreignKey({columns:[t.tripSegmentId,t.tripId,t.companyId],foreignColumns:[tripSegments.id,tripSegments.tripId,tripSegments.companyId]}).onDelete('restrict')]).enableRLS();
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
// Checkout/payment constraints are applied by 0006_checkout_payment.sql.
export const bookings=pgTable('bookings',{
 id:uuid('id').primaryKey().defaultRandom(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),seatHoldId:uuid('seat_hold_id').notNull().unique(),bookerUserId:uuid('booker_user_id').notNull(),requestKey:uuid('request_key').notNull(),payloadHash:text('payload_hash').notNull(),mode:text('mode').notNull(),contactEmail:text('contact_email').notNull(),amount:bigint('amount',{mode:'bigint'}).notNull(),snapshot:jsonb('snapshot').notNull(),status:text('status').notNull().default('PENDING_PAYMENT'),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),confirmedAt:timestamp('confirmed_at',{withTimezone:true}),
}).enableRLS();
export const bookingPassengers=pgTable('booking_passengers',{
 id:uuid('id').primaryKey().defaultRandom(),bookingId:uuid('booking_id').notNull().unique(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),bookerUserId:uuid('booker_user_id').notNull(),mode:text('mode').notNull(),accountId:uuid('account_id'),name:text('name').notNull(),phone:text('phone').notNull(),
}).enableRLS();
export const payments=pgTable('payments',{
 id:uuid('id').primaryKey().defaultRandom(),bookingId:uuid('booking_id').notNull().unique(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),providerOrderId:text('provider_order_id').notNull().unique(),amount:bigint('amount',{mode:'bigint'}).notNull(),status:text('status').notNull().default('PENDING'),paidAt:timestamp('paid_at',{withTimezone:true}),providerTransactionId:text('provider_transaction_id').unique(),providerStatus:text('provider_status'),creationState:text('creation_state').notNull().default('NOT_STARTED'),creationLease:uuid('creation_lease'),creationLeaseUntil:timestamp('creation_lease_until',{withTimezone:true}),snapToken:text('snap_token'),snapRedirectUrl:text('snap_redirect_url'),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),lastError:text('last_error'),
}).enableRLS();
export const paymentEvents=pgTable('payment_events',{
 id:uuid('id').primaryKey().defaultRandom(),paymentId:uuid('payment_id').notNull(),eventKey:text('event_key').notNull().unique(),fields:jsonb('fields').notNull(),receivedAt:timestamp('received_at',{withTimezone:true}).notNull().defaultNow(),verifiedObservation:jsonb('verified_observation'),verifiedAt:timestamp('verified_at',{withTimezone:true}),status:text('status').notNull().default('RECEIVED'),attempts:integer('attempts').notNull().default(0),leaseId:uuid('lease_id'),leaseUntil:timestamp('lease_until',{withTimezone:true}),nextAttemptAt:timestamp('next_attempt_at',{withTimezone:true}).notNull().defaultNow(),processedAt:timestamp('processed_at',{withTimezone:true}),lastError:text('last_error'),
}).enableRLS();
export const seatAssignments=pgTable('seat_assignments',{
 id:uuid('id').primaryKey().defaultRandom(),bookingPassengerId:uuid('booking_passenger_id').notNull().unique(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),tripSeatId:uuid('trip_seat_id').notNull(),fromSequence:integer('from_sequence').notNull(),toSequence:integer('to_sequence').notNull(),assignedAt:timestamp('assigned_at',{withTimezone:true}).notNull().defaultNow(),
}).enableRLS();
export const confirmedOccupancy=pgTable('confirmed_occupancy',{inventoryId:uuid('inventory_id').primaryKey(),assignmentId:uuid('assignment_id').notNull(),tripId:uuid('trip_id').notNull(),companyId:uuid('company_id').notNull()}).enableRLS();
export const tickets=pgTable('tickets',{
 id:uuid('id').primaryKey().defaultRandom(),bookingPassengerId:uuid('booking_passenger_id').notNull().unique(),assignmentId:uuid('assignment_id').notNull().unique(),tripId:uuid('trip_id').notNull(),companyId:uuid('company_id').notNull(),tokenHash:text('token_hash').notNull().unique(),ciphertext:text('ciphertext').notNull(),nonce:text('nonce').notNull(),authTag:text('auth_tag').notNull(),keyVersion:text('key_version').notNull(),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
}).enableRLS();
export const paymentResolutions=pgTable('payment_resolutions',{
 id:uuid('id').primaryKey().defaultRandom(),bookingId:uuid('booking_id').notNull().unique(),companyId:uuid('company_id').notNull(),tripId:uuid('trip_id').notNull(),actorId:uuid('actor_id').notNull(),requestKey:uuid('request_key').notNull(),action:text('action').notNull(),amount:bigint('amount',{mode:'bigint'}).notNull(),reason:text('reason').notNull(),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
}).enableRLS();
export const bookingAuditEvents=pgTable('booking_audit_events',{
 id:uuid('id').primaryKey().defaultRandom(),bookingId:uuid('booking_id').notNull(),action:text('action').notNull(),actorId:uuid('actor_id'),metadata:jsonb('metadata').notNull(),createdAt:timestamp('created_at',{withTimezone:true}).notNull().defaultNow(),
}).enableRLS();

