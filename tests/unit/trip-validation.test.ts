import { expect, it } from 'vitest';
import { parseTripDraft } from '@/modules/trip/validation';
const id='00000000-0000-4000-8000-000000000001';
it('validates the draft shape and normalizes name', () => {
  const input={name:' Trip ',routeId:id,vehicleId:id,serviceClassId:id,departureWib:'2026-10-08T08:00',salesCloseWib:null};
  expect(parseTripDraft(input).name).toBe('Trip');
  expect(()=>parseTripDraft({...input,name:''})).toThrow();
  expect(()=>parseTripDraft({...input,routeId:'foreign-invalid'})).toThrow();
  expect(()=>parseTripDraft({...input,departureWib:'2026-02-30T08:00'})).toThrow();
});
