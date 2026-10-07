import { expect, it } from 'vitest';
import { parseWibInstant, intervalCutoff } from '@/modules/trip/time';
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
