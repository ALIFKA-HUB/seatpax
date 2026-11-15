import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

export function createDatabaseConnection(url: string, options?: { max?: number }) {
  const client = postgres(url, {
    prepare: false,
    max: options?.max ?? 4,
    ssl: "require",
    connect_timeout: 5,
    idle_timeout: 20,
    max_lifetime: 300,
  });
  return {
    db: drizzle(client),
    close: async () => { await client.end({ timeout: 5 }); },
  };
}
