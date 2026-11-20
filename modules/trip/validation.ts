import { z } from 'zod';
import { expandRecurringSchedule, parseWibInstant } from './time';
import type { IsoWeekday, RecurringScheduleOccurrence, RecurringTripInput, TripDraftInput } from './types';

const time = z.string().refine(value => {
  try {
    parseWibInstant(value);
    return true;
  } catch {
    return false;
  }
}, 'Tanggal/jam WIB tidak valid.');

export function parseTripDraft(raw: unknown): TripDraftInput {
  return z
    .object({
      name: z.string().trim().min(1).max(120),
      routeId: z.uuid(),
      vehicleId: z.uuid(),
      serviceClassId: z.uuid(),
      departureWib: time,
      salesCloseWib: time.nullable(),
    })
    .parse(raw);
}

const isoWeekdaySchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
  z.literal(6),
  z.literal(7),
]);

export function parseRecurringTripDraft(raw: unknown): {
  input: RecurringTripInput;
  occurrences: RecurringScheduleOccurrence[];
} {
  const parsed = z
    .object({
      name: z.string().trim().min(1).max(120),
      routeId: z.uuid(),
      vehicleId: z.uuid(),
      serviceClassId: z.uuid(),
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      departureTime: z.string().regex(/^\d{2}:\d{2}$/),
      weekdays: z.array(isoWeekdaySchema).min(1).max(7),
      salesCloseBeforeMin: z.number().int().min(0).max(10080).nullable(),
    })
    .parse(raw);

  const weekdays = [...new Set(parsed.weekdays)].sort((a, b) => a - b) as IsoWeekday[];
  const input: RecurringTripInput = { ...parsed, weekdays };
  const occurrences = expandRecurringSchedule(input);
  return { input, occurrences };
}
