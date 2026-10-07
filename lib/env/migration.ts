export const DEV_PROJECT_REF = 'slbkhdsfafcxaxqdxmet';
export function parseMigrationEnvironment(env: Record<string, string | undefined>) {
  try {
    const raw = env.DATABASE_MIGRATION_URL?.trim();
    if (!raw) throw new Error();
    const url = new URL(raw);
    const session = url.hostname === 'aws-0-ap-southeast-1.pooler.supabase.com' && url.username === `postgres.${DEV_PROJECT_REF}`;
    const direct = url.hostname === `db.${DEV_PROJECT_REF}.supabase.co` && url.username === 'postgres';
    if (!['postgres:', 'postgresql:'].includes(url.protocol) || url.port !== '5432' || url.pathname !== '/postgres' || !url.password || url.search || url.hash || !(session || direct)) throw new Error();
    return { url: raw, projectRef: DEV_PROJECT_REF };
  } catch { throw new Error('Invalid migration configuration: DATABASE_MIGRATION_URL'); }
}
