import { expect, it } from 'vitest';
import { parseRecurringTripDraft, parseTripDraft } from '@/modules/trip/validation';
const id='00000000-0000-4000-8000-000000000001';
it('validates the draft shape and normalizes name', () => {
  const input={name:' Trip ',routeId:id,vehicleId:id,serviceClassId:id,departureWib:'2026-10-08T08:00',salesCloseWib:null};
  expect(parseTripDraft(input).name).toBe('Trip');
  expect(()=>parseTripDraft({...input,name:''})).toThrow();
  expect(()=>parseTripDraft({...input,routeId:'foreign-invalid'})).toThrow();
  expect(()=>parseTripDraft({...input,departureWib:'2026-02-30T08:00'})).toThrow();
});
it('validates recurring trip input and deduplicates weekdays', () => {
  const rec = parseRecurringTripDraft({
    name: ' Pagi Rutin ',
    routeId: id,
    vehicleId: id,
    serviceClassId: id,
    startDate: '2026-11-23',
    endDate: '2026-11-29',
    departureTime: '07:00',
    weekdays: [5, 1, 5],
    salesCloseBeforeMin: null,
  });
  expect(rec.input.name).toBe('Pagi Rutin');
  expect(rec.input.weekdays).toEqual([1, 5]);
  expect(rec.occurrences.map(o => o.date)).toEqual(['2026-11-23', '2026-11-27']);
  expect(() => parseRecurringTripDraft({ name: 'X', routeId: id, vehicleId: id, serviceClassId: id, startDate: '2026-11-23', endDate: '2026-11-29', departureTime: '07:00', weekdays: [], salesCloseBeforeMin: null })).toThrow();
});
