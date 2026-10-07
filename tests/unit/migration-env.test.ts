import { describe, it, expect } from 'vitest';
import { parseMigrationEnvironment, DEV_PROJECT_REF } from '@/lib/env/migration';
const url = `postgresql://postgres.slbkhdsfafcxaxqdxmet:secret@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`;
describe('migration target', () => {
  it('accepts exact development session target', () => {
    expect(parseMigrationEnvironment({ DATABASE_MIGRATION_URL: url })).toEqual({ url, projectRef: DEV_PROJECT_REF });
  });
  it.each([undefined, url.replace(':5432', ':6543'), url.replace('postgres.slbkhdsfafcxaxqdxmet', 'postgres.other'), url.replace('aws-0-ap-southeast-1.pooler.supabase.com', 'evil.test'), url.replace('/postgres', '/other')])('rejects unsafe target without secret', (value) => {
    expect(() => parseMigrationEnvironment({ DATABASE_MIGRATION_URL: value })).toThrow('Invalid migration configuration');
    try { parseMigrationEnvironment({ DATABASE_MIGRATION_URL: value }); } catch (error) { expect(String(error)).not.toContain('secret'); }
  });
});
