import 'server-only';
import {notFound,redirect} from 'next/navigation';
import {z} from 'zod';
import {getDatabase} from '@/lib/db';
import {AccessError,requireAccess} from '@/modules/access/server';

export interface AdminDashboardTripItem {
  id: string;
  name: string;
  status: string;
  departureAt: string;
  routeName: string;
  vehicleName: string;
  className: string;
  bookedCount: number;
  seatCapacity: number;
}

export interface AdminDashboardDailyPoint {
  dayKey: string;
  dayShort: string;
  dateNum: number;
  count: number;
}

export interface AdminDashboardWeekDay {
  dayShort: string;
  dateNum: number;
  isToday: boolean;
  tripCount: number;
}

export interface AdminDashboardData {
  companyId: string;
  companyName: string;
  nowWibLabel: string;
  monthYearWibLabel: string;
  kpis: {
    openTrips: number;
    draftTrips: number;
    totalTrips: number;
    confirmedBookings: number;
    openConflicts: number;
    openComplaints: number;
  };
  resources: {
    routes: number;
    stops: number;
    vehicles: number;
    templates: number;
    classes: number;
  };
  upcomingTrips: AdminDashboardTripItem[];
  dailyActivity: AdminDashboardDailyPoint[];
  weekStrip: AdminDashboardWeekDay[];
}

const DAY_SHORTS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function toWibYmd(date: Date): { year: number; month: number; day: number; dow: number; key: string } {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const year = Number(parts.find(p => p.type === 'year')?.value ?? 2026);
  const month = Number(parts.find(p => p.type === 'month')?.value ?? 1);
  const day = Number(parts.find(p => p.type === 'day')?.value ?? 1);
  const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const dow = new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).getUTCDay();
  return { year, month, day, dow, key };
}

function addDaysUtc(year: number, month: number, day: number, delta: number): { year: number; month: number; day: number; dow: number; key: string } {
  const d = new Date(Date.UTC(year, month - 1, day + delta, 12, 0, 0));
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  const da = d.getUTCDate();
  return {
    year: y,
    month: m,
    day: da,
    dow: d.getUTCDay(),
    key: `${y}-${String(m).padStart(2, '0')}-${String(da).padStart(2, '0')}`,
  };
}

export async function adminDashboardData(companyId: string): Promise<AdminDashboardData> {
  if (!z.uuid().safeParse(companyId).success) notFound();
  try {
    await requireAccess('tenant.admin', companyId);
  } catch (error) {
    if (error instanceof AccessError && error.reason === 'unauthenticated') redirect('/login');
    notFound();
  }

  const sql = getDatabase().$client;
  const [companyRow] = await sql<{ name: string }[]>`
    select name from public.companies where id = ${companyId} limit 1
  `;
  if (!companyRow) notFound();

  const [kpiRows, resourceRows, tripRows, bookingActivityRows, weekTripRows] = await Promise.all([
    sql<{
      openTrips: number;
      draftTrips: number;
      totalTrips: number;
      confirmedBookings: number;
      openConflicts: number;
      openComplaints: number;
    }[]>`
      select
        (select count(*)::int from public.trips where company_id = ${companyId} and status = 'OPEN_FOR_SALE') as "openTrips",
        (select count(*)::int from public.trips where company_id = ${companyId} and status = 'DRAFT') as "draftTrips",
        (select count(*)::int from public.trips where company_id = ${companyId}) as "totalTrips",
        (select count(*)::int from public.bookings where company_id = ${companyId} and status = 'CONFIRMED') as "confirmedBookings",
        (select count(*)::int from public.bookings where company_id = ${companyId} and status = 'PAYMENT_CONFLICT') as "openConflicts",
        (select count(*)::int from public.helpdesk_cases where company_id = ${companyId} and status <> 'SELESAI') as "openComplaints"
    `,
    sql<{
      routes: number;
      stops: number;
      vehicles: number;
      templates: number;
      classes: number;
    }[]>`
      select
        (select count(*)::int from public.routes where company_id = ${companyId}) as routes,
        (select count(*)::int from public.stops where company_id = ${companyId}) as stops,
        (select count(*)::int from public.vehicles where company_id = ${companyId}) as vehicles,
        (select count(*)::int from public.seat_templates where company_id = ${companyId}) as templates,
        (select count(*)::int from public.service_classes where company_id = ${companyId}) as classes
    `,
    sql<{
      id: string;
      name: string;
      status: string;
      departureAt: string;
      routeName: string;
      vehicleName: string;
      className: string;
      bookedCount: number;
      seatCapacity: number;
    }[]>`
      select
        t.id,
        t.name,
        t.status,
        t.departure_at::text as "departureAt",
        coalesce(t.identity_snapshot->>'routeName', r.name, 'Rute PO') as "routeName",
        coalesce(t.identity_snapshot->>'vehicleName', v.name, 'Armada') as "vehicleName",
        coalesce(t.identity_snapshot->>'className', sc.name, 'Reguler') as "className",
        (select count(*)::int from public.bookings b where b.trip_id = t.id and b.company_id = t.company_id and b.status = 'CONFIRMED') as "bookedCount",
        case
          when (select count(*)::int from public.trip_seats ts where ts.trip_id = t.id and ts.company_id = t.company_id) > 0
          then (select count(*)::int from public.trip_seats ts where ts.trip_id = t.id and ts.company_id = t.company_id)
          else coalesce((select count(*)::int from public.seat_template_cells stc where stc.seat_template_id = v.seat_template_id and stc.company_id = t.company_id and stc.type = 'SEAT'), 0)
        end as "seatCapacity"
      from public.trips t
      left join public.routes r on r.id = t.route_id and r.company_id = t.company_id
      left join public.vehicles v on v.id = t.vehicle_id and v.company_id = t.company_id
      left join public.service_classes sc on sc.id = t.service_class_id and sc.company_id = t.company_id
      where t.company_id = ${companyId}
        and t.status in ('OPEN_FOR_SALE', 'DRAFT')
      order by (t.departure_at >= now()) desc, t.departure_at asc
      limit 6
    `,
    sql<{ dayKey: string; count: number }[]>`
      select
        to_char(created_at at time zone 'Asia/Jakarta', 'YYYY-MM-DD') as "dayKey",
        count(*)::int as count
      from public.bookings
      where company_id = ${companyId}
        and status = 'CONFIRMED'
        and created_at >= now() - interval '7 days'
      group by 1
    `,
    sql<{ dayKey: string; count: number }[]>`
      select
        to_char(departure_at at time zone 'Asia/Jakarta', 'YYYY-MM-DD') as "dayKey",
        count(*)::int as count
      from public.trips
      where company_id = ${companyId}
        and status in ('OPEN_FOR_SALE', 'DRAFT')
        and departure_at >= now() - interval '7 days'
        and departure_at <= now() + interval '7 days'
      group by 1
    `,
  ]);

  const now = new Date();
  const todayWib = toWibYmd(now);
  const nowWibLabel = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(now);
  const monthYearWibLabel = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    month: 'long',
    year: 'numeric',
  }).format(now);

  const activityMap = new Map(bookingActivityRows.map(r => [r.dayKey, Number(r.count)]));
  const dailyActivity: AdminDashboardDailyPoint[] = [];
  for (let offset = -6; offset <= 0; offset++) {
    const d = addDaysUtc(todayWib.year, todayWib.month, todayWib.day, offset);
    dailyActivity.push({
      dayKey: d.key,
      dayShort: DAY_SHORTS[d.dow],
      dateNum: d.day,
      count: activityMap.get(d.key) ?? 0,
    });
  }

  const weekTripMap = new Map(weekTripRows.map(r => [r.dayKey, Number(r.count)]));
  const mondayOffset = todayWib.dow === 0 ? -6 : 1 - todayWib.dow;
  const weekStrip: AdminDashboardWeekDay[] = [];
  for (let i = 0; i < 7; i++) {
    const d = addDaysUtc(todayWib.year, todayWib.month, todayWib.day, mondayOffset + i);
    weekStrip.push({
      dayShort: DAY_SHORTS[d.dow],
      dateNum: d.day,
      isToday: d.key === todayWib.key,
      tripCount: weekTripMap.get(d.key) ?? 0,
    });
  }

  const kpis = kpiRows[0] ?? {
    openTrips: 0,
    draftTrips: 0,
    totalTrips: 0,
    confirmedBookings: 0,
    openConflicts: 0,
    openComplaints: 0,
  };
  const resources = resourceRows[0] ?? {
    routes: 0,
    stops: 0,
    vehicles: 0,
    templates: 0,
    classes: 0,
  };

  return {
    companyId,
    companyName: companyRow.name,
    nowWibLabel,
    monthYearWibLabel,
    kpis,
    resources,
    upcomingTrips: tripRows,
    dailyActivity,
    weekStrip,
  };
}
