import "server-only";
import { getDatabaseEnv } from "../env/server";
import { createDatabaseConnection } from "./connection";

let connection: ReturnType<typeof createDatabaseConnection> | undefined;

export function getDatabase() {
  connection ??= createDatabaseConnection(getDatabaseEnv().databaseUrl);
  return connection.db;
}
