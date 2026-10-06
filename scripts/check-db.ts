import { config } from "dotenv";
import { sql } from "drizzle-orm";
import { parseDatabaseEnv } from "../lib/env/database";
import { createDatabaseConnection } from "../lib/db/connection";
import { checkDatabase } from "../lib/db/check";

config({ path: ".env.local", quiet: true });

async function main() {
  let databaseUrl: string;
  try { databaseUrl = parseDatabaseEnv(process.env).databaseUrl; }
  catch {
    console.error("Invalid database configuration. Check DATABASE_URL and DATABASE_MIGRATION_URL.");
    process.exitCode = 1;
    return;
  }
  try {
    const connection = createDatabaseConnection(databaseUrl);
    const result = await checkDatabase({
      query: () => connection.db.execute(sql`select 1 as ok`),
      close: connection.close,
    });
    console.log(result.ok ? "Database connection OK" : "Database connection failed. Check project connectivity and configuration.");
    process.exitCode = result.ok ? 0 : 1;
  } catch {
    console.error("Database connection failed. Check project connectivity and configuration.");
    process.exitCode = 1;
  }
}

await main();
