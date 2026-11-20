import { expect, it } from 'vitest';
import { parseWibInstant, intervalCutoff, expandRecurringSchedule } from '@/modules/trip/time';
it('converts WIB independently of the host and crosses midnight', () => {
  expect(parseWibInstant('2026-10-08T08:00')).toBe('2026-10-08T01:00:00.000Z');
  expect(parseWibInstant('2026-10-08T00:30')).toBe('2026-10-07T17:30:00.000Z');
});
it('rejects invalid calendar dates and ambiguous timestamps', () => {
  for (const value of ['2026-02-30T08:00','2026-10-08T24:00','2026-10-08T08','2026-10-08T08:00Z','08/10/2026 08:00']) expect(() => parseWibInstant(value)).toThrow();
});
it('takes the earlier exclusive cutoff', () => {
  expect(intervalCutoff('2026-10-08T01:00:00Z',null)).toBe('2026-10-08T01:00:00Z');
  expect(intervalCutoff('2026-10-08T01:00:00Z','2026-10-08T00:00:00Z')).toBe('2026-10-08T00:00:00Z');
});
it('expands recurring WIB schedules matching selected ISO weekdays and cutoff offset', () => {
  // 2026-11-23 is Mon (1), 2026-11-25 is Wed (3), 2026-11-27 is Fri (5)
  const list = expandRecurringSchedule({
    startDate: '2026-11-23',
    endDate: '2026-11-29',
    departureTime: '00:30',
    weekdays: [1, 3, 5],
    salesCloseBeforeMin: 30,
  });
  expect(list.map(o => o.date)).toEqual(['2026-11-23', '2026-11-25', '2026-11-27']);
  expect(list[0].departureAt).toBe('2026-11-22T17:30:00.000Z');
  expect(list[0].salesCloseAt).toBe('2026-11-22T17:00:00.000Z');
});
it('rejects empty weekday matches, inverted ranges, and oversized batches', () => {
  expect(() => expandRecurringSchedule({ startDate: '2026-11-24', endDate: '2026-11-26', departureTime: '07:00', weekdays: [1], salesCloseBeforeMin: null })).toThrow();
  expect(() => expandRecurringSchedule({ startDate: '2026-11-26', endDate: '2026-11-24', departureTime: '07:00', weekdays: [1], salesCloseBeforeMin: null })).toThrow();
  expect(() => expandRecurringSchedule({ startDate: '2026-11-01', endDate: '2027-01-30', departureTime: '07:00', weekdays: [1, 2, 3, 4, 5, 6, 7], salesCloseBeforeMin: null })).toThrow();
});
