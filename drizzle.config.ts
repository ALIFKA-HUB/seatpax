import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";
import { parseDatabaseEnv } from "./lib/env/database";

config({ path: ".env.local", quiet: true });

export default defineConfig({
  dialect: "postgresql",
  schema: "./db/schema/*.ts",
  out: "./db/migrations",
  dbCredentials: { url: parseDatabaseEnv(process.env).migrationUrl },
});
