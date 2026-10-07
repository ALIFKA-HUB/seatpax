import { it, expect } from 'vitest';
import { resolveConflict } from '@/modules/fleet/conflict';
it('adopts latest or explicitly confirms overwrite; neither mutates the draft', () => {
  const draft = { name: 'Mine', version: 1 }, latest = { name: 'Latest', version: 3 };
  expect(() => resolveConflict(draft, latest, 'overwrite', false)).toThrow();
  expect(draft.version).toBe(1);
  expect(resolveConflict(draft, latest, 'adopt', false)).toEqual(latest);
  expect(resolveConflict(draft, latest, 'overwrite', true)).toEqual({ name: 'Mine', version: 3 });
});
it('supports vehicle revisions', () => {
  expect(resolveConflict({ name: 'Mine', revision: 1 }, { name: 'Latest', revision: 4 }, 'overwrite', true)).toEqual({ name: 'Mine', revision: 4 });
});
