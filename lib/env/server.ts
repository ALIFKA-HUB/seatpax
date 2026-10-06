import "server-only";
import { parseDatabaseEnv } from "./database";

export function getDatabaseEnv() {
  return parseDatabaseEnv({
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_MIGRATION_URL: process.env.DATABASE_MIGRATION_URL,
  });
}
