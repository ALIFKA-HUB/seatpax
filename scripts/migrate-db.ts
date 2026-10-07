import { config } from 'dotenv';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { createDatabaseConnection } from '../lib/db/connection';
import { parseMigrationEnvironment } from '../lib/env/migration';
config({ path: '.env.local', quiet: true });
export async function migrateDatabase(env = process.env) {
  const target = parseMigrationEnvironment(env);
  const connection = createDatabaseConnection(target.url);
  try { await migrate(connection.db, { migrationsFolder: './drizzle' }); }
  finally { await connection.close(); }
}
migrateDatabase().then(() => console.log('Development migration complete.')).catch(() => {
  console.error('Development migration failed. Check target, connection and migration history.'); process.exitCode = 1;
});
