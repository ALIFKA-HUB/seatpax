import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

export function createDatabaseConnection(url: string) {
  const client = postgres(url, {
    prepare: false,
    max: 1,
    ssl: { rejectUnauthorized: true },
    connect_timeout: 5,
    idle_timeout: 20,
  });
  return {
    db: drizzle(client),
    close: async () => { await client.end({ timeout: 5 }); },
  };
}
